/** Test-only harness. This does not replace the shared report contract or adapter owned by Hiển. */
"use client";
import { useEffect, useState } from 'react';
import { ChartResult, type ChartSeries } from '@/components/report/chart-result';
import { ReportDraft } from '@/components/report/report-draft';
import { EvidenceDrawer } from '@/components/report/evidence-drawer';
import { reportSections } from '@/components/report/report-checks';
import { useReportAdapter } from '@/components/report/use-report-adapter';
import { mockWorkspaceRepository } from '@/mocks/workspace-repository';
const { getProjectUnits, getAreaMetrics, getSlowMovingUnits } = mockWorkspaceRepository;
const projects = mockWorkspaceRepository.getProjects();
function TestCase({ projectId, scenario }: {
    projectId: string;
    scenario: string;
}) {
    const project = projects.find(p => p.id === projectId)!;
    const rows = scenario === 'empty' ? [] : getProjectUnits(projectId).filter(r => scenario !== 'no-2pn' || r.type !== '2PN');
    const metrics = scenario === 'empty' ? [] : getAreaMetrics(projectId);
    const status = scenario === 'loading' ? 'loading' : scenario === 'error' ? 'error' : scenario === 'empty' ? 'empty' : scenario === 'partial' ? 'partial' : 'ready';
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [sourceNotice, setSourceNotice] = useState<string | null>(null);
    const f = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    const traceSteps = ['Source', 'Calculation', 'Comparison', 'Evidence', 'Insight'] as const;
    const areaEvidence = metrics.map(m => ({
        id: 'area-' + m.area,
        title: 'Chỉ số ' + m.area,
        source: 'WorkspaceRepository.getAreaMetrics',
        snapshot: project.snapshot,
        calculation: 'avg(daysOnMarket), avg(absorption), avg(pricePerSqm) theo phân khu',
        sampleScope: `${m.units} căn thuộc phân khu ${m.area}`,
        description: `${m.units} căn; DOM ${m.avgDom} ngày; hấp thụ ${m.absorption}%; giá ${m.pricePerSqm} triệu đồng/m².`,
        limitation: 'Dữ liệu mô phỏng; tương quan không chứng minh nhân quả.',
        traceSteps,
    }));
    const absorptionEvidence = (['Studio', '1PN', '2PN', '3PN'] as const).flatMap(type => {
        const units = rows.filter(r => r.type === type);
        if (!units.length) return [];
        const value = Number((units.reduce((sum, row) => sum + row.absorption, 0) / units.length).toFixed(1));
        return [{
            id: 'type-' + type,
            title: 'Hấp thụ nhóm ' + type,
            source: 'WorkspaceRepository.getProjectUnits',
            snapshot: project.snapshot,
            calculation: 'avg(absorption) theo loại căn',
            sampleScope: `${units.length} căn loại ${type}`,
            description: `Hấp thụ trung bình ${value}% trên ${units.length} căn ${type}.`,
            limitation: 'Chỉ số mô phỏng từ snapshot; không thay thế tỷ lệ bán thực tế.',
            traceSteps,
        }];
    });
    const evidence = [...areaEvidence, ...absorptionEvidence];
    const areaEvidenceIds = areaEvidence.map(item => item.id);
    const absorptionEvidenceIds = absorptionEvidence.map(item => item.id);
    const focus = [...metrics].sort((a, b) => b.avgDom - a.avgDom)[0];
    const domSeries: ChartSeries = { mode: 'dom', description: 'DOM trung bình theo phân khu. Đường đứt thể hiện ngưỡng 90 ngày cần review.', rows: metrics.map(m => ({ label: m.area, value: m.avgDom, sampleSize: m.units, evidenceId: 'area-' + m.area })) };
    const absorptionSeries: ChartSeries = { mode: 'absorption', description: 'Trung bình trường absorption của các căn trong từng loại căn; không thay thế tỷ lệ bán thực tế.', rows: (['Studio', '1PN', '2PN', '3PN'] as const).map(type => { const units = rows.filter(r => r.type === type); return { label: type, value: units.length ? Number((units.reduce((s, r) => s + r.absorption, 0) / units.length).toFixed(1)) : null, sampleSize: units.length, evidenceId: units.length ? 'type-' + type : undefined }; }) };
    const priceSeries: ChartSeries = { mode: 'price-dom', description: 'Giá chào và DOM của riêng nhóm 2PN. Các chỉ số mô tả mối liên hệ, chưa chứng minh quan hệ nhân quả.', rows: metrics.map(m => { const units = rows.filter(r => r.area === m.area && r.type === '2PN'); return { label: m.area, value: units.length ? Number((units.reduce((s, r) => s + r.pricePerSqm, 0) / units.length).toFixed(1)) : null, dom: units.length ? Math.round(units.reduce((s, r) => s + r.daysOnMarket, 0) / units.length) : null, sampleSize: units.length, evidenceId: units.length ? 'area-' + m.area : undefined }; }) };
    const slow = getSlowMovingUnits(projectId, 3);
    const paragraphs = [
        [`${focus?.area ?? 'Dự án'} là khu vực cần theo dõi${focus ? `, DOM trung bình ${focus.avgDom} ngày` : ''}. Ưu tiên rà soát nhóm tồn kho kéo dài trước khi điều chỉnh giá.`],
        [`Snapshot ${project.snapshot}, ${rows.length} căn. Các bản ghi PARTIAL cần được đối soát trước khi đưa ra quyết định.`],
        [metrics.map(m => `${m.area}: DOM ${m.avgDom} ngày, hấp thụ ${f(m.absorption)}%, giá ${f(m.pricePerSqm)} triệu đồng/m²`).join('; ')],
        [slow.map(r => `${r.code}: ${r.daysOnMarket} ngày, ${f(r.pricePerSqm)} triệu đồng/m²`).join('; ')],
        ['Giá, mức ưu đãi và DOM chỉ thể hiện mối liên hệ trong snapshot. Cần kiểm chứng bằng thử nghiệm và dữ liệu theo thời gian.'],
        ['Trong 30 ngày: đối soát dữ liệu tuần đầu; thử nghiệm có kiểm soát tuần 2–3; đánh giá kết quả và điều chỉnh ở tuần 4.'],
    ];
    const adapterSections = reportSections.map((s, i) => ({ id: s.id, paragraphs: scenario === 'missing-section' && s.id === 'actions' ? [] : paragraphs[i], claims: i === 0 ? [{ id: 'claim-dom', text: 'DOM cần được theo dõi', evidenceIds: [scenario === 'missing' ? 'unresolved' : focus ? 'area-' + focus.area : 'unresolved'] }] : i === 2 ? [{ id: 'claim-abs', text: 'Hấp thụ khác nhau giữa các loại căn', evidenceIds: scenario === 'missing' ? ['unresolved'] : absorptionEvidenceIds }, { id: 'claim-price', text: 'Giá chào khác nhau giữa các phân khu', evidenceIds: scenario === 'missing' ? ['unresolved'] : areaEvidenceIds }] : [] }));
    const { adapter, snapshot } = useReportAdapter({ reportId: project.id, sections: adapterSections, evidence }, {
        exportDurationMs: scenario === 'exporting' ? 30_000 : undefined,
        failFirstExport: scenario === 'export-error',
        initial: scenario === 'approved' ? { reviewStatus: 'approved', reviewedClaims: ['claim-dom', 'claim-abs', 'claim-price'] }
            : scenario === 'pending' ? { reviewStatus: 'pending_review' }
                : scenario === 'changes' ? { reviewStatus: 'changes_requested', revisionReason: 'Bổ sung giới hạn kết luận' }
                    : scenario === 'expired' ? { exportState: { status: 'expired' } }
                        : {},
    });
    // Demonstrates the mandatory "Đang export" state on mount; TestCase remounts per scenario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (scenario === 'exporting') adapter.exportReport(); }, []);
    const sections = reportSections.map((s, i) => ({ ...s, paragraphs: adapterSections[i].paragraphs, claims: adapterSections[i].claims.map(c => ({ ...c, reviewed: snapshot.reviewedClaims.includes(c.id) })) }));
    return <>
  <ChartResult projectName={project.name} snapshot={project.snapshot} series={[domSeries, absorptionSeries, priceSeries]} status={status} onOpenEvidence={setSelectedEvidence}/>
  <EvidenceDrawer open={!!selectedEvidence} claimText="Nguồn dữ liệu biểu đồ" evidenceIds={selectedEvidence ? [selectedEvidence] : []} evidence={evidence} onClose={() => setSelectedEvidence(null)} onOpenSource={setSourceNotice}/>
  {sourceNotice && <p role="status">Đã chọn dữ liệu nguồn: {sourceNotice}</p>}
  <div style={{ height: 20 }}/>
  <ReportDraft projectName={project.name} snapshot={project.snapshot} sampleSize={rows.length} partialCount={rows.filter(r => r.dataQuality === 'PARTIAL').length} version={1} sections={sections} evidence={evidence} chartCount={3} status={status} onReviewClaim={adapter.reviewClaim} onOpenEvidenceSource={setSourceNotice} actions={{ reviewStatus: snapshot.reviewStatus, exportState: snapshot.exportState, revisionReason: snapshot.revisionReason || undefined, error: snapshot.error, onReview: adapter.requestReview, onExport: adapter.exportReport }}/>
  {snapshot.exportState.status === 'success' && <button onClick={() => adapter.expireNow()}>QA: expire</button>}
 </>;
}
export default function Page() { const [project, setProject] = useState('green-avenue'); const [scenario, setScenario] = useState('ready'); return <main style={{ maxWidth: 980, margin: '24px auto', padding: '0 12px' }}><div style={{ padding: 12, marginBottom: 16, background: '#fff', borderRadius: 12 }}><label>Dự án <select aria-label="Dự án" value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label> <label>Scenario <select aria-label="Scenario" value={scenario} onChange={e => setScenario(e.target.value)}>{['ready', 'loading', 'empty', 'partial', 'error', 'no-2pn', 'missing', 'missing-section', 'pending', 'changes', 'approved', 'exporting', 'export-error', 'expired'].map(s => <option key={s}>{s}</option>)}</select></label></div><TestCase key={project + scenario} projectId={project} scenario={scenario}/></main>; }
