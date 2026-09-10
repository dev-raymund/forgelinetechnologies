"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePost, type ActionState } from "../../actions";
import type { Post } from "@/db/schema";
import { IconAlert, IconExternal } from "@/components/admin-icons";

export default function PostForm({ post }: { post?: Post }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePost, {});

  return (
    <form className="adm-form wide" action={formAction}>
      {post && <input type="hidden" name="id" value={post.id} />}
      {state?.error && <div className="adm-err"><IconAlert />{state.error}</div>}

      <div className="adm-fieldset">
        <p className="legend">Post</p>
        <label className="adm-field">
          <span>
            Title
            {post?.published && (
              <em className="hint"> · URL stays /blog/{post.slug} so links don&apos;t break</em>
            )}
          </span>
          <input type="text" name="title" defaultValue={post?.title ?? ""} required autoFocus />
        </label>

        <label className="adm-field">
          <span>Excerpt <em className="hint">blog index + search results</em></span>
          <textarea name="excerpt" defaultValue={post?.excerpt ?? ""} rows={2} />
        </label>

        <label className="adm-field">
          <span>Tags <em className="hint">comma separated</em></span>
          <input type="text" name="tags" defaultValue={post?.tags ?? ""} placeholder="wordpress, performance" />
        </label>
      </div>

      <div className="adm-fieldset">
        <p className="legend">Cover image</p>
        <div className="grid2">
          <label className="adm-field">
            <span>Image URL</span>
            <input type="text" name="coverUrl" defaultValue={post?.coverUrl ?? ""} />
          </label>
          <label className="adm-field">
            <span>Alt text</span>
            <input type="text" name="coverAlt" defaultValue={post?.coverAlt ?? ""} />
          </label>
        </div>
      </div>

      <div className="adm-fieldset">
        <p className="legend">Body</p>
        <p className="legend-sub">Markdown — ## heading, **bold**, [link](url), - list, ```code```</p>
        <label className="adm-field">
          <textarea className="tall" name="body" defaultValue={post?.body ?? ""} />
        </label>
      </div>

      <div className="adm-fieldset">
        <label className="adm-check">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? false} />
          <span>
            Published
            <br />
            <em className="hint">Drafts are invisible on /blog until this is ticked.</em>
          </span>
        </label>
      </div>

      <div className="adm-formbar">
        <button className="adm-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <Link className="adm-btn ghost" href="/admin/posts">Cancel</Link>
        {post?.published && (
          <>
            <span className="spacer" />
            <Link className="adm-btn subtle" href={`/blog/${post.slug}`} target="_blank">
              <IconExternal /> View live
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
