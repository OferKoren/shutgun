import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Member } from '../lib/api';
import FlowerEasterEgg from './FlowerEasterEgg';

const KEY = 'flower.enabled';

type SettingResp = { key: string; value: string | null };

export default function FlowerGate({ me }: { me: Member }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['setting', KEY],
    queryFn: () => api<SettingResp>(`/settings/${KEY}`),
  });
  const enabled = data?.value !== 'false';

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      api<SettingResp>(`/settings/${KEY}`, {
        method: 'PUT',
        body: JSON.stringify({ value: next ? 'true' : 'false' }),
      }),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['setting', KEY] });
      const prev = qc.getQueryData<SettingResp>(['setting', KEY]);
      qc.setQueryData<SettingResp>(['setting', KEY], {
        key: KEY,
        value: next ? 'true' : 'false',
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['setting', KEY], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['setting', KEY] }),
  });

  const isSpy = me.name === 'המרגל';
  const isTarget = isSpy || me.name.includes('עדן');

  return (
    <>
      {isTarget && enabled && <FlowerEasterEgg />}
      {isSpy && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle.mutate(!enabled);
          }}
          disabled={toggle.isPending}
          className="fixed bottom-20 md:bottom-4 left-4 z-50 px-3 py-1.5 rounded-full text-xs font-semibold shadow-soft bg-surface border border-hairline hover:bg-muted disabled:opacity-50"
          title={enabled ? 'כיבוי פרחים' : 'הדלקת פרחים'}
        >
          🌸 {enabled ? 'כבה פרחים' : 'הדלק פרחים'}
        </button>
      )}
    </>
  );
}
