export async function compareBuilds(build1File, build2File) {
  const formData = new FormData();
  formData.append('build1', build1File);
  formData.append('build2', build2File);

  const response = await fetch('/api/compare', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}
