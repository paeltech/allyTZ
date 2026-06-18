# WhatsApp Group Creation Troubleshooting

## Error: HTTP 404 when creating groups

If you're getting a 404 error when trying to create WhatsApp groups, this could mean:

### Possible Causes:

1. **WaSender API doesn't support group creation**
   - WaSender API might not have a group creation endpoint
   - Groups may need to be created manually in WhatsApp and then added to the system

2. **Incorrect API endpoint**
   - The endpoint format might be different
   - Check WaSender API documentation for the correct endpoint

3. **API key or session issues**
   - Verify your `WASENDER_API_KEY` and `WASENDER_SESSION_ID` are set correctly
   - Check if your session is still connected

### Solutions:

#### Option 1: Create Groups Manually (Recommended if API doesn't support it)

1. **Create groups manually in WhatsApp:**
   - Open WhatsApp
   - Create a new group named "AllyTZ Panel - Monthly Subscribers"
   - Add yourself as admin
   - Note the group JID (you can get this from WaSender dashboard or by sending a message to the group)

2. **Add groups to database manually:**
   ```sql
   INSERT INTO whatsapp_groups (
     group_name,
     group_jid,
     group_number,
     month_year,
     member_count,
     is_active
   ) VALUES (
     'AllyTZ Panel - Monthly Subscribers',
     'YOUR_GROUP_JID_HERE',
     1,
     '2026-01',  -- Current month in YYYY-MM format
     0,
     true
   );
   ```

3. **Then use the refresh function to add subscribers:**
   - The refresh function will add subscribers to existing groups
   - Or use the "Add Member" function in manage-whatsapp-groups

#### Option 2: Check WaSender API Documentation

1. Visit: https://wasenderapi.com/api-docs
2. Look for group-related endpoints
3. Verify the correct endpoint format
4. Update the code with the correct endpoint

#### Option 3: Verify API Credentials

Check your Supabase secrets:
```bash
supabase secrets list
```

Verify:
- `WASENDER_API_KEY` is set correctly
- `WASENDER_SESSION_ID` is set correctly
- Your WhatsApp session is connected in WaSender dashboard

#### Option 4: Check Edge Function Logs

1. Go to Supabase Dashboard > Edge Functions > refresh-whatsapp-groups
2. Check the logs for detailed error messages
3. Look for the actual API response to see what endpoint format WaSender expects

### Next Steps:

1. **Check WaSender Dashboard:**
   - Log into https://wasenderapi.com
   - Check if there's a "Groups" section
   - See if groups can be created via the dashboard

2. **Contact WaSender Support:**
   - If group creation via API is not available, contact their support
   - Ask about group management capabilities

3. **Alternative Approach:**
   - If API doesn't support group creation, create groups manually
   - Use the API only for adding/removing members and sending messages
   - This is actually more reliable and gives you more control

### Current Implementation:

The code now tries multiple endpoint formats:
- `/api/create-group`
- `/api/groups/create`
- `/api/group/create`

If all fail, check the edge function logs for the detailed error response from WaSender API.
