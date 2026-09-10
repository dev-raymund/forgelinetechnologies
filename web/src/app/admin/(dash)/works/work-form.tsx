"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveWork, type ActionState } from "../../actions";
import { WORK_CATEGORIES, type Work } from "@/db/schema";
import { IconAlert } from "@/components/admin-icons";

export default function WorkForm({ work }: { work?: Work }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveWork, {});

  return (
    <form className="adm-form" action={formAction}>
      {work && <input type="hidden" name="id" value={work.id} />}
      {state?.error && (
        <div className="adm-err"><IconAlert />{state.error}</div>
      )}

      <div className="adm-fieldset">
        <p className="legend">Details</p>
        <label className="adm-field">
          <span>Title</span>
          <input type="text" name="title" defaultValue={work?.title ?? ""} required autoFocus />
        </label>

        <div className="grid2">
          <label className="adm-field">
            <span>Category <em className="hint">drives the homepage filters</em></span>
            <select name="category" defaultValue={work?.category ?? "sites"}>
              {WORK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>Badge <em className="hint">e.g. E-commerce · Winery</em></span>
            <input type="text" name="badge" defaultValue={work?.badge ?? ""} />
          </label>
        </div>

        <label className="adm-field">
          <span>Description</span>
          <textarea name="description" defaultValue={work?.description ?? ""} rows={3} />
        </label>
      </div>

      <div className="adm-fieldset">
        <p className="legend">Media &amp; link</p>
        <div className="grid2">
          <label className="adm-field">
            <span>Image URL <em className="hint">/assets/projects/x.jpg or https://</em></span>
            <input type="text" name="imageUrl" defaultValue={work?.imageUrl ?? ""} />
          </label>
          <label className="adm-field">
            <span>Image alt text</span>
            <input type="text" name="imageAlt" defaultValue={work?.imageAlt ?? ""} />
          </label>
        </div>
        <div className="grid2">
          <label className="adm-field">
            <span>Live site URL</span>
            <input type="text" name="liveUrl" defaultValue={work?.liveUrl ?? ""} placeholder="https://" />
          </label>
          <label className="adm-field">
            <span>Sort order <em className="hint">lower shows first</em></span>
            <input type="number" name="sortOrder" defaultValue={work?.sortOrder ?? 0} />
          </label>
        </div>
      </div>

      <div className="adm-fieldset">
        <label className="adm-check">
          <input type="checkbox" name="published" defaultChecked={work?.published ?? true} />
          <span>
            Show on the public site
            <br />
            <em className="hint">Unchecked keeps it in the admin but off the homepage.</em>
          </span>
        </label>
      </div>

      <div className="adm-formbar">
        <button className="adm-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : work ? "Save changes" : "Add project"}
        </button>
        <Link className="adm-btn ghost" href="/admin/works">Cancel</Link>
      </div>
    </form>
  );
}
