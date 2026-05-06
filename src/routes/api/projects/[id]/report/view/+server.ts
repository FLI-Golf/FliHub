/**
 * GET /api/projects/[id]/report/view
 * Fetches all project data server-side and streams a PDF report.
 * No client-side JS required — works as a plain <a href> link.
 */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const C = {
	navy:'#0f172a', slate:'#1e293b', slateL:'#334155', muted:'#64748b',
	border:'#cbd5e1', bgLight:'#f8fafc', white:'#ffffff',
	green:'#10b981', blue:'#3b82f6', amber:'#f59e0b', violet:'#8b5cf6',
	red:'#ef4444', gray:'#94a3b8',
};

function fmt(n: number) {
	return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n??0);
}
function fmtDate(d: string|null|undefined) {
	if (!d) return '\u2014';
	try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
	catch { return '\u2014'; }
}
function pct(a:number,b:number){return b===0?0:Math.min(100,(a/b)*100);}
function parseChecklist(cl:string|null|undefined):{done:number;total:number;items:{text:string;checked:boolean}[]}{
	if(!cl)return{done:0,total:0,items:[]};
	// Handle both JSON array and markdown string formats
	let items:{text:string;checked:boolean}[]=[];
	if(typeof cl==='string'&&cl.trim().startsWith('[')){
		try{
			const arr=JSON.parse(cl);
			items=arr.map((i:any)=>({text:String(i.text||i.label||i.name||i),checked:!!(i.checked||i.completed||i.done)}));
		}catch{/* fall through to markdown */}
	}
	if(items.length===0){
		const lines=cl.split('\n').filter((l:string)=>l.trim().startsWith('- ['));
		items=lines.map((l:string)=>({
			checked:l.includes('[x]')||l.includes('[X]'),
			text:l.replace(/^\s*-\s*\[[ xX]\]\s*/,'').trim()
		}));
	}
	return{done:items.filter(i=>i.checked).length,total:items.length,items};
}

const STATUS_LABEL:Record<string,string>={todo:'To Do',in_progress:'In Progress',blocked:'Blocked',completed:'Completed',cancelled:'Cancelled'};
const STATUS_COLOR:Record<string,string>={todo:C.gray,in_progress:C.blue,blocked:C.red,completed:C.green,cancelled:C.muted};
const PRI_COLOR:Record<string,string>={low:C.gray,medium:C.amber,high:C.red,urgent:'#dc2626'};

async function buildPDF(project:any,tasks:any[],expenses:any[]):Promise<Buffer>{
	const PDFDocument=(await import('pdfkit')).default;
	return new Promise((resolve,reject)=>{
		const doc=new PDFDocument({size:'LETTER',margin:0,bufferPages:true,
			info:{Title:`${project.name} \u2014 Project Report`,Author:'FLI Golf League'}});
		const chunks:Buffer[]=[];
		doc.on('data',(c:Buffer)=>chunks.push(c));
		doc.on('end',()=>resolve(Buffer.concat(chunks)));
		doc.on('error',reject);

		const PW=612,PH=792,ML=48,MR=48,CW=PW-ML-MR;
		const FOOTER_H=36,MAX_Y=PH-FOOTER_H-20;
		const genDate=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

		function sectionLabel(label:string,y:number):number{
			doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7)
			   .text(label,ML,y,{characterSpacing:1.2,lineBreak:false});
			doc.moveTo(ML,y+11).lineTo(PW-MR,y+11).strokeColor(C.border).lineWidth(0.5).stroke();
			return y+18;
		}
		function newPage():number{
			doc.addPage();
			doc.rect(0,0,PW,6).fill(C.navy);
			doc.rect(0,6,PW,2).fill(C.green);
			return 24;
		}
		function ensure(y:number,h:number):number{return y+h>MAX_Y?newPage():y;}
		function drawFooter(n:number){
			const fy=PH-FOOTER_H;
			doc.rect(0,fy,PW,FOOTER_H).fill(C.navy);
			doc.fillColor(C.gray).font('Helvetica').fontSize(7)
			   .text(`Confidential \u2014 FLI Golf League  \u00b7  Generated ${genDate}  \u00b7  Page ${n}`,
			         ML,fy+13,{width:CW,align:'center',lineBreak:false});
		}

		// Header
		doc.rect(0,0,PW,96).fill(C.navy);
		doc.rect(0,92,PW,4).fill(C.green);
		doc.fillColor(C.green).font('Helvetica-Bold').fontSize(7)
		   .text('FLI GOLF LEAGUE  \u00b7  PROJECT STATUS REPORT',ML,20,{characterSpacing:1.5,lineBreak:false});
		doc.fillColor(C.white).font('Helvetica-Bold').fontSize(20)
		   .text(project.name,ML,34,{width:CW-110,lineBreak:false});
		if(project.type){
			doc.roundedRect(PW-MR-95,34,95,18,4).fill(C.slateL);
			doc.fillColor(C.gray).font('Helvetica-Bold').fontSize(7)
			   .text(project.type.toUpperCase(),PW-MR-95,40,{width:95,align:'center',characterSpacing:1,lineBreak:false});
		}
		doc.fillColor(C.gray).font('Helvetica').fontSize(8)
		   .text(`Generated ${genDate}  \u00b7  FY ${project.fiscalYear??new Date().getFullYear()}`,ML,72,{lineBreak:false});

		let y=112;

		// Stat boxes
		const budget=project.project_budget??0;
		const taskBudgetSum=tasks.reduce((s,t)=>s+(t.task_budget??0),0);
		const paid=expenses.filter(e=>e.status==='paid').reduce((s,e)=>s+(e.amount??0),0);
		const approved=expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+(e.amount??0),0);
		const submitted=expenses.filter(e=>e.status==='submitted').reduce((s,e)=>s+(e.amount??0),0);
		const totalExpensed=paid+approved+submitted;
		const inTasks=Math.max(0,taskBudgetSum-totalExpensed);
		const unallocated=Math.max(0,budget-taskBudgetSum);
		const actualSpend=paid+approved;
		const p=(v:number)=>budget>0?Math.min(100,(v/budget)*100):0;

		const boxW=(CW-9)/4;
		[
			{label:'PROJECT BUDGET',value:fmt(budget),sub:null},
			{label:'TASK BUDGETS',value:fmt(taskBudgetSum),sub:`${p(taskBudgetSum).toFixed(0)}% allocated`},
			{label:'ACTUAL SPEND',value:fmt(actualSpend),sub:`${p(actualSpend).toFixed(0)}% of budget`},
			{label:'UNALLOCATED',value:fmt(unallocated),sub:'remaining'},
		].forEach((b,i)=>{
			const bx=ML+i*(boxW+3);
			doc.roundedRect(bx,y,boxW,54,5).fillAndStroke(C.bgLight,C.border);
			doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(6.5)
			   .text(b.label,bx+8,y+9,{width:boxW-16,characterSpacing:0.5,lineBreak:false});
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(14)
			   .text(b.value,bx+8,y+21,{width:boxW-16,lineBreak:false});
			if(b.sub)doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
			             .text(b.sub,bx+8,y+40,{width:boxW-16,lineBreak:false});
		});
		y+=66;

		// Project details
		y=sectionLabel('PROJECT DETAILS',y);
		const dcW=CW/2-6;
		const details:[string,string][]=[
			['Department',project.expand?.department?.name??project.department??'\u2014'],
			['Start Date',fmtDate(project.startDate)],
			['End Date',fmtDate(project.endDate)],
			['Forecasted',(project.project_forecasted_expenses??0)>0?fmt(project.project_forecasted_expenses):'\u2014'],
			['Fiscal Year',String(project.fiscalYear??'\u2014')],
			['Type',project.type??'\u2014'],
		];
		details.forEach(([label,val],i)=>{
			const col=i%2,row=Math.floor(i/2);
			const dx=ML+col*(dcW+12),dy=y+row*20;
			doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(label,dx,dy,{width:80,lineBreak:false});
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8).text(val,dx+85,dy,{width:dcW-85,lineBreak:false});
		});
		y+=Math.ceil(details.length/2)*20+8;

		if(project.description){
			y=ensure(y,30);
			doc.fillColor(C.slateL).font('Helvetica').fontSize(8)
			   .text(project.description,ML,y,{width:CW});
			y=(doc as any).y+12;
		}

		// Expense pipeline
		y=ensure(y,70);
		y=sectionLabel('EXPENSE PIPELINE',y);
		const segs=[
			{pct:p(paid),color:C.green,label:'Paid',amt:paid},
			{pct:p(approved),color:C.blue,label:'Approved',amt:approved},
			{pct:p(submitted),color:C.amber,label:'Submitted',amt:submitted},
			{pct:p(inTasks),color:C.violet,label:'In Tasks',amt:inTasks},
		];
		doc.roundedRect(ML,y,CW,14,4).fill('#e2e8f0');
		let bx2=ML;
		for(const s of segs){
			if(s.pct<=0)continue;
			const sw=Math.max(1,(s.pct/100)*CW);
			doc.rect(bx2,y,sw,14).fill(s.color);
			bx2+=sw;
		}
		doc.roundedRect(ML,y,CW,14,4).stroke(C.border);
		y+=22;
		const legColW=CW/2;
		segs.forEach((s,i)=>{
			const col=i%2,row=Math.floor(i/2);
			const lx=ML+col*legColW,ly=y+row*16;
			doc.circle(lx+5,ly+5,4).fill(s.color);
			doc.fillColor(s.amt>0?C.navy:C.gray).font('Helvetica').fontSize(8)
			   .text(`${s.label}: ${s.amt>0?fmt(s.amt):'\u2014'}`,lx+14,ly,{width:legColW-14,lineBreak:false});
		});
		y+=Math.ceil(segs.length/2)*16+4;
		if(unallocated>0){
			doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
			   .text(`${fmt(unallocated)} unallocated`,ML,y,{lineBreak:false});
			y+=14;
		}
		y+=8;

		// Tasks
		if(tasks.length>0){
			y=ensure(y,50);
			y=sectionLabel('TASKS',y);
			const td=tasks.filter(t=>t.status==='completed'||t.status==='done').length;
			const tt=tasks.length;
			const tp=pct(td,tt);
			doc.fillColor(C.muted).font('Helvetica').fontSize(8)
			   .text(`${td} of ${tt} complete  \u00b7  ${tp.toFixed(0)}% done`,ML,y,{lineBreak:false});
			y+=13;
			doc.roundedRect(ML,y,CW,7,3).fill('#e2e8f0');
			if(tp>0)doc.roundedRect(ML,y,(tp/100)*CW,7,3).fill(C.green);
			y+=16;

			for(const task of tasks){
				const cl   = parseChecklist(task.subTasksChecklist);
				const sc   = STATUS_COLOR[task.status] ?? C.gray;
				const sl   = STATUS_LABEL[task.status] ?? task.status;

				// ── Time left ──────────────────────────────────────────
				function timeLeft(start: string|null|undefined, due: string|null|undefined): string {
					const now  = Date.now();
					const s    = start ? new Date(start).getTime() : null;
					const d    = due   ? new Date(due).getTime()   : null;
					if (!d) return '';
					const msLeft = d - now;
					const daysLeft = Math.ceil(msLeft / 86400000);
					if (daysLeft < 0)  return `${Math.abs(daysLeft)}d overdue`;
					if (daysLeft === 0) return 'Due today';
					if (daysLeft <= 7)  return `${daysLeft}d left`;
					if (daysLeft <= 30) return `${Math.ceil(daysLeft/7)}w left`;
					return `${Math.ceil(daysLeft/30)}mo left`;
				}
				const tl = timeLeft(task.startDate, task.dueDate);
				const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed';

				// ── Task header (no pre-reservation — let it flow) ─────
				// If less than 60px left on page, start a new page
				if (y + 60 > MAX_Y) y = newPage();

				const titleH = 46;
				doc.roundedRect(ML, y, CW, titleH, 5).fillAndStroke(C.bgLight, C.border);
				doc.roundedRect(ML, y, 4, titleH, 3).fill(sc);

				// Title
				doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9.5)
				   .text(task.title || 'Untitled', ML+12, y+7, { width: CW-150, lineBreak: false });

				// Status badge
				const bW = 72, bX = ML+CW-bW;
				doc.roundedRect(bX, y+6, bW, 14, 3).fill(sc);
				doc.fillColor(C.white).font('Helvetica-Bold').fontSize(6.5)
				   .text(sl, bX, y+10, { width: bW, align: 'center', lineBreak: false });

				// Priority badge
				if (task.priority) {
					const pc = PRI_COLOR[task.priority] ?? C.gray;
					const pW = 48, pX = ML+CW-bW-pW-3;
					doc.roundedRect(pX, y+6, pW, 14, 3).fill(pc);
					doc.fillColor(C.white).font('Helvetica-Bold').fontSize(6.5)
					   .text(task.priority.toUpperCase(), pX, y+10, { width: pW, align: 'center', lineBreak: false });
				}

				// Meta row 1: dates + time left
				const dateParts: string[] = [];
				if (task.startDate) dateParts.push(`Start: ${fmtDate(task.startDate)}`);
				if (task.dueDate)   dateParts.push(`Due: ${fmtDate(task.dueDate)}`);
				if (tl) dateParts.push(tl);
				doc.fillColor(isOverdue ? C.red : C.muted).font('Helvetica').fontSize(7.5)
				   .text(dateParts.join('  \u00b7  ') || '\u2014', ML+12, y+24, { width: CW-24, lineBreak: false });

				// Meta row 2: budget / hours / subtasks / tags
				const meta: string[] = [];
				if ((task.task_budget ?? 0) > 0)      meta.push(`Budget: ${fmt(task.task_budget)}`);
				if ((task.task_actual_cost ?? 0) > 0)  meta.push(`Actual: ${fmt(task.task_actual_cost)}`);
				if ((task.estimatedHours ?? 0) > 0)    meta.push(`${task.estimatedHours}h est.`);
				if ((task.actualHours ?? 0) > 0)       meta.push(`${task.actualHours}h logged`);
				if (cl.total > 0) meta.push(`${cl.done}/${cl.total} subtasks`);
				if (task.tags) meta.push(task.tags);
				if (meta.length > 0) {
					doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
					   .text(meta.join('  \u00b7  '), ML+12, y+35, { width: CW-24, lineBreak: false });
				}

				y += titleH + 2;

				// ── Checklist items (no gap — flows directly below) ────
				if (cl.items.length > 0) {
					const itemH = 13;
					const blockH = cl.items.length * itemH + 6;
					// Start new page only if we can't fit at least 3 items
					if (y + Math.min(blockH, 3*itemH+6) > MAX_Y) y = newPage();

					doc.roundedRect(ML, y, CW, blockH, 0).fillAndStroke('#f1f5f9', C.border);
					let iy = y + 3;
					for (const item of cl.items) {
						// Page break mid-checklist
						if (iy + itemH > MAX_Y) {
							y = newPage();
							iy = y;
						}
						// Checkbox
						if (item.checked) {
							doc.roundedRect(ML+10, iy+2, 9, 9, 2).fill(C.green);
							doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7)
							   .text('\u2713', ML+10, iy+2, { width: 9, align: 'center', lineBreak: false });
						} else {
							doc.roundedRect(ML+10, iy+2, 9, 9, 2).fillAndStroke(C.white, C.border);
						}
						doc.fillColor(item.checked ? C.muted : C.navy)
						   .font('Helvetica').fontSize(7.5)
						   .text(item.text, ML+24, iy+3, { width: CW-34, lineBreak: false });
						iy += itemH;
					}
					y = iy + 3;
				}

				// ── Description (strip HTML) ───────────────────────────
				if (task.description?.trim()) {
					const desc = task.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
					if (desc) {
						if (y + 16 > MAX_Y) y = newPage();
						doc.fillColor(C.slateL).font('Helvetica').fontSize(7.5)
						   .text(desc, ML+12, y+2, { width: CW-24 });
						y = (doc as any).y + 4;
					}
				}

				y += 6; // gap between tasks
			}
		} // end if(tasks.length>0)

		// Footers
		const range=(doc as any).bufferedPageRange();
		for(let i=0;i<range.count;i++){
			doc.switchToPage(range.start+i);
			drawFooter(i+1);
		}
		doc.end();
	});
}

export const GET: RequestHandler = async ({ locals, url, params }) => {
	await RequestContext.from(locals, url);
	const { getAdminPocketBase } = await import('$lib/infra/pocketbase/pbClient');
	const pb = await getAdminPocketBase();
	const projectId = params.id;
	console.log('[report] pb auth valid:', pb.authStore.isValid, 'token prefix:', pb.authStore.token?.slice(0,20));

	try {
		const [projectRec, allTasks, allExpenses] = await Promise.all([
			pb.collection('projects').getOne(projectId, { expand: 'department' }).catch(() => null),
			pb.collection('tasks').getList(1, 200, { expand: 'projectId' }).then((r: any) => r.items).catch((e: any) => { console.error('[report] tasks error:', e?.message, e?.status); return []; }),
			pb.collection('expenses').getFullList({ sort: '-created' }).catch(() => []),
		]);
		// Filter client-side by projectId (relation field)
		const filteredTasks = (allTasks as any[]).filter(t => {
			const pid = typeof t.projectId === 'object' ? t.projectId?.id : t.projectId;
			return pid === projectId;
		});
		const filteredExpenses = (allExpenses as any[]).filter(e => {
			const pid = typeof e.projectId === 'object' ? e.projectId?.id : e.projectId;
			return pid === projectId;
		});

		if (!projectRec) throw error(404, 'Project not found');


		const buf = await buildPDF(projectRec as any, filteredTasks, filteredExpenses);
		const slug = ((projectRec as any).name as string).replace(/\s+/g,'-').toLowerCase().replace(/[^a-z0-9-]/g,'');
		const date = new Date().toISOString().slice(0,10);

		return new Response(buf, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${slug}-report-${date}.pdf"`,
				'Content-Length': String(buf.length),
			},
		});
	} catch (err: any) {
		console.error('[report/view] error:', err);
		throw error(500, err?.message ?? 'PDF generation failed');
	}
};
