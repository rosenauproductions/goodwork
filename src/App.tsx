import { useState } from 'react'
import './App.css'

type JobStatus = 'Needs review' | 'Awaiting parent' | 'Ready to assign' | 'Payment pending'
type Job = { id: string; title: string; category: string; requestor: string; volunteer: string; status: JobStatus; risk: 'Green' | 'Yellow'; date: string }

const initialJobs: Job[] = [
  { id: 'JF-104', title: 'Leaf cleanup and bagging', category: 'Yard', requestor: 'Mara Ellis', volunteer: 'Jonah R.', status: 'Awaiting parent', risk: 'Green', date: 'Today, 4:30 PM' },
  { id: 'JF-103', title: 'Dog walking, two afternoons', category: 'Pet services', requestor: 'Daniel Cho', volunteer: 'Unassigned', status: 'Ready to assign', risk: 'Yellow', date: 'Sat, Oct 12' },
  { id: 'JF-102', title: 'Church welcome table setup', category: 'Events', requestor: 'Grace Church', volunteer: 'Amelia T.', status: 'Payment pending', risk: 'Green', date: 'Oct 6, 9:00 AM' },
  { id: 'JF-101', title: 'Exterior car wash', category: 'Vehicle', requestor: 'Kevin Patel', volunteer: 'Noah B.', status: 'Needs review', risk: 'Green', date: 'Oct 14, 2:00 PM' },
]

function App() {
  const [jobs, setJobs] = useState(initialJobs)
  const [filter, setFilter] = useState<'All jobs' | JobStatus>('All jobs')
  const [notice, setNotice] = useState('')
  const filteredJobs = filter === 'All jobs' ? jobs : jobs.filter((job) => job.status === filter)
  const confirmPayment = (jobId: string) => {
    setJobs((current) => current.map((job) => job.id === jobId ? { ...job, status: 'Payment pending' } : job))
    setNotice('Payment confirmed and added to the parent review queue.')
    window.setTimeout(() => setNotice(''), 3500)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">+</span><span>goodwork</span></div>
        <div className="church-switcher"><span className="church-avatar">GC</span><span><strong>Grace Community</strong><small>Church workspace</small></span><span className="chevron">⌄</span></div>
        <nav aria-label="Primary navigation"><p className="nav-label">Workspace</p><button className="nav-item active"><span>▦</span>Overview</button><button className="nav-item"><span>◌</span>Jobs <b>4</b></button><button className="nav-item"><span>♧</span>Families</button><button className="nav-item"><span>◫</span>Messages <b className="dot">•</b></button><p className="nav-label">Manage</p><button className="nav-item"><span>✓</span>Approvals</button><button className="nav-item"><span>◒</span>Fundraising</button><button className="nav-item"><span>⚙</span>Settings</button></nav>
        <div className="sidebar-footer"><div className="user-chip"><span className="user-avatar">JM</span><span><strong>Jordan Miller</strong><small>Program admin</small></span><span className="more">•••</span></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Grace Community</span><span>/</span><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button" aria-label="Notifications">♢<i></i></button><button className="new-job">+ New job</button></div></header>
        <section className="content-wrap">
          <div className="page-heading"><div><p className="eyebrow">Sunday, October 13, 2024</p><h1>Good morning, Jordan</h1><p className="intro">Here is what needs your attention across the service exchange.</p></div><div className="date-pill">This week <span>⌄</span></div></div>
          {notice && <div className="toast" role="status">✓ {notice}</div>}
          <div className="metric-grid"><article className="metric-card primary"><div className="metric-label"><span>Raised this month</span><span className="trend">↗ 18.4%</span></div><strong>$1,840</strong><div className="metric-foot"><span>of $3,000 monthly goal</span><div className="progress"><span style={{ width: '61%' }} /></div></div></article><article className="metric-card"><div className="metric-label"><span>Active jobs</span><span className="metric-icon green">◌</span></div><strong>12</strong><div className="metric-foot"><span className="good-text">4 need your review</span><span className="metric-arrow">→</span></div></article><article className="metric-card"><div className="metric-label"><span>Participating youth</span><span className="metric-icon coral">♧</span></div><strong>28</strong><div className="metric-foot"><span>6 new this month</span><span className="metric-arrow">→</span></div></article></div>
          <div className="section-head"><div><h2>Jobs needing attention</h2><p>Keep every job moving safely through the loop.</p></div><button className="text-button">View all jobs <span>→</span></button></div>
          <div className="jobs-panel"><div className="filter-row"><div className="filters">{(['All jobs', 'Needs review', 'Awaiting parent', 'Ready to assign'] as const).map((item) => <button key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item}{item !== 'All jobs' && <span>{jobs.filter((job) => job.status === item).length}</span>}</button>)}</div><button className="filter-menu">Sort: newest <span>⌄</span></button></div><div className="job-list">{filteredJobs.map((job) => <article className="job-row" key={job.id}><div className="job-symbol">{job.category === 'Pet services' ? '♧' : job.category === 'Events' ? '✦' : '✳'}</div><div className="job-info"><div className="job-title"><strong>{job.title}</strong><span className="job-id">{job.id}</span></div><p>{job.requestor} <span>·</span> {job.date}</p></div><div className="job-person"><span className="mini-avatar">{job.volunteer === 'Unassigned' ? '?' : job.volunteer.slice(0, 2)}</span><span>{job.volunteer}</span></div><span className={'risk ' + job.risk.toLowerCase()}><i />{job.risk} risk</span><span className={'status ' + job.status.toLowerCase().replaceAll(' ', '-')}>{job.status}</span>{job.status === 'Payment pending' ? <button className="row-action" onClick={() => confirmPayment(job.id)}>Confirm payment</button> : <button className="row-action ghost">Review <span>→</span></button>}</article>)}</div>{filteredJobs.length === 0 && <div className="empty-state">No jobs in this view.</div>}</div>
          <div className="lower-grid"><section className="activity"><div className="section-head compact"><div><h2>Recent activity</h2><p>A clear record for families and admins.</p></div><button className="text-button">See history <span>→</span></button></div><div className="activity-list"><div><span className="activity-icon mint">✓</span><p><strong>Payment confirmed</strong><br /><span>Amelia's parent confirmed $60 from Grace Church</span></p><time>18 min</time></div><div><span className="activity-icon blue">⌂</span><p><strong>New job request</strong><br /><span>Daniel Cho requested dog walking for Oct 12</span></p><time>1 hr</time></div><div><span className="activity-icon peach">!</span><p><strong>Parent approval needed</strong><br /><span>Jonah R.'s guardian needs to review leaf cleanup</span></p><time>2 hr</time></div></div></section><section className="safety-card"><div className="safety-head"><div><p className="eyebrow">Safety at a glance</p><h2>All systems clear</h2></div><span className="shield">✓</span></div><p>Every active job has a current eligibility check and assigned contact.</p><div className="safety-stats"><span><strong>12</strong> eligible jobs</span><span><strong>0</strong> open incidents</span></div><button className="outline-button">Open safety log <span>→</span></button></section></div>
        </section>
      </main>
    </div>
  )
}

export default App
