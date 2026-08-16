/**
 * Applies staged edits on top of the server's chunk list so the Explorer can
 * preview split/merge/edit/delete results before "Apply Changes" commits
 * them to Chroma Cloud.
 */
export function applyEditsLocally(chunks, edits) {
  let list = chunks.map((c) => ({ ...c }));

  for (const edit of edits) {
    if (edit.type === 'edit') {
      list = list.map((c) => (c.id === edit.chunkId ? { ...c, text: edit.text } : c));
    } else if (edit.type === 'delete') {
      list = list.filter((c) => c.id !== edit.chunkId);
    } else if (edit.type === 'split') {
      const idx = list.findIndex((c) => c.id === edit.chunkId);
      if (idx !== -1) {
        const base = list[idx].metadata || {};
        list.splice(
          idx,
          1,
          { id: `${edit.chunkId}-a`, text: edit.textA, metadata: { ...base, derivedFrom: edit.chunkId } },
          { id: `${edit.chunkId}-b`, text: edit.textB, metadata: { ...base, derivedFrom: edit.chunkId } }
        );
      }
    } else if (edit.type === 'merge') {
      const [idA, idB] = edit.chunkIds;
      const insertIdx = list.findIndex((c) => c.id === idA);
      const base = list[insertIdx]?.metadata || {};
      list = list.filter((c) => c.id !== idA && c.id !== idB);
      list.splice(Math.min(insertIdx, list.length), 0, {
        id: `${idA}+${idB}`,
        text: edit.text,
        metadata: { ...base, derivedFrom: `${idA},${idB}` },
      });
    }
  }

  return list;
}
