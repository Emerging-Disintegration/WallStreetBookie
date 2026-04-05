import React from 'react';

export default function TagFilter({ tags, activeTag, onTagSelect }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="tag-filter-bar">
      <button
        className={`tag-pill ${!activeTag ? 'active' : ''}`}
        onClick={() => onTagSelect(null)}
      >
        All
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
          onClick={() => onTagSelect(activeTag === tag ? null : tag)}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
