"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Search, Calendar, Upload, X, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { PageTransition } from "@/lib/animations";

interface TradeAnalysis {
  id: string;
  trading_pair: string;
  analysis_date: string;
  title: string;
  content: string;
  summary: string | null;
  technical_analysis: any;
  fundamental_analysis: any;
  entry_levels: any;
  exit_levels: any;
  risk_level: "low" | "medium" | "high" | null;
  price: number;
  chart_image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const tradeAnalysisSchema = z.object({
  trading_pair: z.string().min(1, "Trading pair is required"),
  analysis_date: z.string().min(1, "Analysis date is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  summary: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  risk_level: z.enum(["low", "medium", "high"]).optional().nullable(),
  chart_image_url: z.string().optional().nullable(),
});

type TradeAnalysisFormValues = z.infer<typeof tradeAnalysisSchema>;

const TRADING_PAIRS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "EURGBP",
  "NZDUSD",
  "USDCHF",
  "BTCUSD",
];

const AdminTradeAnalyses: React.FC = () => {
  const { session } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<TradeAnalysis | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<TradeAnalysisFormValues>({
    resolver: zodResolver(tradeAnalysisSchema),
    defaultValues: {
      trading_pair: "",
      analysis_date: format(new Date(), "yyyy-MM-dd"),
      title: "",
      content: "",
      summary: "",
      price: 25.0,
      risk_level: null,
      chart_image_url: null,
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `trade-analysis-charts/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('trade-analysis-charts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('trade-analysis-charts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showError(error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('chart_image_url', null);
  };

  const { data: analyses, isLoading } = useQuery<TradeAnalysis[]>({
    queryKey: ["admin-trade-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TradeAnalysisFormValues) => {
      let chartImageUrl = values.chart_image_url;

      // Upload image if a new file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          chartImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload chart image');
        }
      }

      const { error } = await supabase.from("trade_analyses").insert({
        trading_pair: values.trading_pair,
        analysis_date: values.analysis_date,
        title: values.title,
        content: values.content,
        summary: values.summary || null,
        price: values.price,
        risk_level: values.risk_level,
        chart_image_url: chartImageUrl,
        created_by: session?.user?.id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-analyses"] });
      showSuccess("Trade analysis created successfully");
      setIsDialogOpen(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      showError(error.message || "Failed to create analysis");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TradeAnalysisFormValues }) => {
      let chartImageUrl = values.chart_image_url;

      // Upload image if a new file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          chartImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload chart image');
        }
      }

      const { error } = await supabase
        .from("trade_analyses")
        .update({
          trading_pair: values.trading_pair,
          analysis_date: values.analysis_date,
          title: values.title,
          content: values.content,
          summary: values.summary || null,
          price: values.price,
          risk_level: values.risk_level,
          chart_image_url: chartImageUrl,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-analyses"] });
      showSuccess("Trade analysis updated successfully");
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedAnalysis(null);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update analysis");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trade_analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-analyses"] });
      showSuccess("Trade analysis deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to delete analysis");
    },
  });

  const filteredAnalyses = analyses?.filter((analysis) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      analysis.trading_pair.toLowerCase().includes(query) ||
      analysis.title.toLowerCase().includes(query) ||
      analysis.content.toLowerCase().includes(query)
    );
  });

  const getRiskBadge = (risk: string | null) => {
    if (!risk) return null;
    const variants: Record<string, { label: string; className: string }> = {
      low: { label: "Low", className: "bg-green-600 text-white" },
      medium: { label: "Medium", className: "bg-yellow-600 text-white" },
      high: { label: "High", className: "bg-red-600 text-white" },
    };
    const variant = variants[risk];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleEdit = (analysis: TradeAnalysis) => {
    setSelectedAnalysis(analysis);
    setIsEditMode(true);
    form.reset({
      trading_pair: analysis.trading_pair,
      analysis_date: analysis.analysis_date,
      title: analysis.title,
      content: analysis.content,
      summary: analysis.summary || "",
      price: analysis.price,
      risk_level: analysis.risk_level,
      chart_image_url: analysis.chart_image_url || null,
    });
    setImagePreview(analysis.chart_image_url || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedAnalysis(null);
    form.reset({
      trading_pair: "",
      analysis_date: format(new Date(), "yyyy-MM-dd"),
      title: "",
      content: "",
      summary: "",
      price: 25.0,
      risk_level: null,
      chart_image_url: null,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: TradeAnalysisFormValues) => {
    if (isEditMode && selectedAnalysis) {
      updateMutation.mutate({ id: selectedAnalysis.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-gold" size={24} />
                <div>
                  <h1 className="text-2xl font-semibold text-white">Manage Trade Analyses</h1>
                  <p className="text-rainy-grey text-sm mt-1">
                    Create and manage daily trading pair analyses
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-gold text-cursed-black hover:bg-gold-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Analysis
              </Button>
            </div>

            <div className="flex gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by pair, title, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                />
              </div>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading...</div>
            ) : filteredAnalyses?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No analyses found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">Pair</TableHead>
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Price</TableHead>
                      <TableHead className="text-white">Risk</TableHead>
                      <TableHead className="text-white">Chart</TableHead>
                      <TableHead className="text-white">Created</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnalyses?.map((analysis) => (
                      <TableRow key={analysis.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-white font-medium">
                          {analysis.trading_pair}
                        </TableCell>
                        <TableCell className="text-white">{analysis.title}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(analysis.analysis_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-white">${analysis.price.toFixed(2)}</TableCell>
                        <TableCell>{getRiskBadge(analysis.risk_level)}</TableCell>
                        <TableCell>
                          {analysis.chart_image_url ? (
                            <Badge className="bg-green-600 text-white">
                              <ImageIcon size={12} className="mr-1" />
                              Has Chart
                            </Badge>
                          ) : (
                            <span className="text-rainy-grey text-sm">No chart</span>
                          )}
                        </TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(analysis.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(analysis)}
                              className="text-gold hover:text-gold-dark"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this analysis?")) {
                                  deleteMutation.mutate(analysis.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </PanelCard>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black border-steel-wool text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditMode ? "Edit Trade Analysis" : "Create Trade Analysis"}
              </DialogTitle>
              <DialogDescription className="text-rainy-grey">
                {isEditMode
                  ? "Update the trade analysis details"
                  : "Create a new daily trading pair analysis"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trading_pair"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Trading Pair</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue placeholder="Select trading pair" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRADING_PAIRS.map((pair) => (
                              <SelectItem key={pair} value={pair}>
                                {pair}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="analysis_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Analysis Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Analysis title"
                          className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary of the analysis"
                          className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full analysis content"
                          className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="risk_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Risk Level</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                          value={field.value || "null"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">None</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="chart_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Chart Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Chart preview"
                                className="w-full h-auto max-h-64 object-contain rounded-lg border border-steel-wool bg-nero"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-steel-wool rounded-lg p-6 text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-rainy-grey mb-2" />
                              <p className="text-rainy-grey text-sm mb-2">
                                Upload a chart image (PNG, JPG, max 5MB)
                              </p>
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-steel-wool text-rainy-grey hover:bg-nero"
                                  disabled={uploadingImage}
                                  asChild
                                >
                                  <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploadingImage ? "Uploading..." : "Choose Image"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          )}
                          <input type="hidden" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsEditMode(false);
                      setSelectedAnalysis(null);
                      form.reset();
                    }}
                    className="border-steel-wool text-rainy-grey"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gold text-cursed-black hover:bg-gold-dark"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {isEditMode ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminTradeAnalyses;
