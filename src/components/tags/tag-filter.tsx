'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const active = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={cn(
              'rounded-sm px-2 py-0.5 text-[11px] font-medium transition-all border',
              active
                ? 'opacity-100'
                : 'opacity-50 hover:opacity-80'
            )}
            style={{
              backgroundColor: `${tag.color}${active ? '20' : '10'}`,
              color: tag.color,
              borderColor: `${tag.color}${active ? '40' : '15'}`,
            }}
          >
            {tag.name}
            <span className="ml-1 opacity-40">{tag.videoCount}</span>
          </button>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => onTagsChange([])}
          className="px-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
