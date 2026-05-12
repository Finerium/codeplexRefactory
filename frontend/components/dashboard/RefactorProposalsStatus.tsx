/**
 * RefactorProposalsStatus. 5-stage kanban of refactor proposals.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx Proposals() function.
 * Stages: proposed -> simulating -> drafted -> accepted -> archived
 * (matches OpenSpec workflow + RefactorStage type union).
 *
 * Each proposal card shows title, id tag, author handle, age. Empty stage
 * renders a dashed-border placeholder.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';
import type { RefactorProposal, RefactorStage } from '@/lib/dashboard/types';

const STAGES: Array<{ id: RefactorStage; label: string }> = [
  { id: 'proposed', label: 'Proposed' },
  { id: 'simulating', label: 'Running sim' },
  { id: 'drafted', label: 'Drafted' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'archived', label: 'Archived' },
];

export interface RefactorProposalsStatusProps {
  proposals: RefactorProposal[];
}

export const RefactorProposalsStatus: React.FC<RefactorProposalsStatusProps> = ({
  proposals,
}) => {
  const grouped: Record<RefactorStage, RefactorProposal[]> = {
    proposed: [],
    simulating: [],
    drafted: [],
    accepted: [],
    archived: [],
  };
  for (const p of proposals) grouped[p.stage].push(p);

  const total = proposals.filter((p) => p.stage !== 'archived').length;
  const awaitingAccept = grouped.drafted.length;

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div>
          <h3>Refactor proposals</h3>
          <div className={styles.cardSub}>
            {total} open · {awaitingAccept} awaiting accept
          </div>
        </div>
        <button type="button" className={styles.ghost}>
          <span>All proposals</span>
          <Icon name="arrow-right" size={12} />
        </button>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.kanban}>
          {STAGES.map((s) => (
            <div key={s.id}>
              <div className={styles.kanbanColHd}>
                <span className={styles.kanbanColHdLabel}>{s.label}</span>
                <span className={`${styles.kanbanColHdCount} ${styles.num}`}>
                  {grouped[s.id].length}
                </span>
              </div>
              <div className={styles.kanbanCol}>
                {grouped[s.id].map((p) => (
                  <div key={p.id} className={styles.proposal}>
                    <div className={styles.proposalTitle}>{p.title}</div>
                    <div className={styles.proposalMeta}>
                      <span className={styles.proposalTag}>{p.id}</span>
                      <span>
                        @{p.authorResident === 'Athena' ? 'Athena' : p.authorLogin}
                      </span>
                      <span style={{ marginLeft: 'auto' }}>{p.ageLabel}</span>
                    </div>
                  </div>
                ))}
                {grouped[s.id].length === 0 && (
                  <div className={styles.kanbanColEmpty}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
