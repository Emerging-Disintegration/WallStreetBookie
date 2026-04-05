import React, { useState, useRef, useEffect } from 'react';

export default function TagEditor({ currentTags, onSave, onClose }) {
  const [tags, setTags] = useState(currentTags || []);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addTag = () => {
    const val = input.trim().replace(/^#/, '');
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setInput('');
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { addTag(); e.preventDefault(); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="tag-editor-popover">
      <div className="tag-editor-tags">
        {tags.map(tag => (
          <span key={tag} className="tag-pill small">
            #{tag}
            <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? '' : 'Add tag...'}
          size={Math.max(input.length, 6)}
        />
      </div>
      <div className="tag-editor-actions">
        <button className="tag-save-btn" onClick={() => onSave(tags)}>Save</button>
      </div>
    </div>
  );
}
