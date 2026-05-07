'use client';

import { useEffect, useState } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
  videoCount: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then(setTags)
      .catch(console.error);
  }, []);

  if (tags.length === 0) return null;

  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  }

  return (
    <>
      <span className="cw-filter-eyebrow">Topics</span>
      {tags.map((tag) => {
        const active = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`cw-chip ${active ? 'active' : ''}`}
          >
            {tag.name}
            <span className="ct">{tag.videoCount}</span>
          </button>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => onTagsChange([])}
          className="cw-chip"
          style={{ border: 0, color: 'var(--fg-3)' }}
        >
          Clear
        </button>
      )}
    </>
  );
}
