import type { SignalPost } from '../types/signal';

export type SignalPostThread = {
  root: SignalPost;
  replies: SignalPost[];
};

function sortByCreatedAsc(a: SignalPost, b: SignalPost) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function getRootId(post: SignalPost, byId: Map<string, SignalPost>): string | null {
  if (!post.parent_post_id || !byId.has(post.parent_post_id)) return null;

  let rootId = post.parent_post_id;
  let cursor = byId.get(post.parent_post_id)!;
  while (cursor.parent_post_id && byId.has(cursor.parent_post_id)) {
    rootId = cursor.parent_post_id;
    cursor = byId.get(cursor.parent_post_id)!;
  }
  return rootId;
}

/**
 * Groups flat signal posts into root messages with nested replies under each root.
 */
export function buildSignalPostThreads(posts: SignalPost[]): SignalPostThread[] {
  const byId = new Map(posts.map((p) => [p.id, p]));
  const repliesByRoot = new Map<string, SignalPost[]>();
  const roots: SignalPost[] = [];

  for (const post of posts) {
    const rootId = getRootId(post, byId);
    if (rootId === null) {
      roots.push(post);
      continue;
    }
    const list = repliesByRoot.get(rootId) ?? [];
    list.push(post);
    repliesByRoot.set(rootId, list);
  }

  roots.sort(sortByCreatedAsc);

  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? []).sort(sortByCreatedAsc),
  }));
}
