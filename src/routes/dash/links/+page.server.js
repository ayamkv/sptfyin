export const load = async ({ fetch, locals }) => {
  const res = await fetch('/api/links?perPage=20&page=1');
  const initial = await res.json();
  return { initial, user: locals.user };
};


