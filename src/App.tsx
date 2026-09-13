import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import './form.css'

type ViewKey = 'Overview' | 'Jobs' | 'Families' | 'Fundraising'
type JobStatus = 'Needs review' | 'Awaiting parent' | 'Ready to assign' | 'Payment pending'
type Job = { id: string; title: string; category: string; requestor: string; volunteer: string; status: JobStatus; risk: 'Green' | 'Yellow'; date: string }
type FilterValue = 'All jobs' | JobStatus

type Family = {
  name: string
  familyType: string
  activeJobs: number
  totalRaised: number
  nextStep: string
}

const storageKey = 'church-fund-raiser-jobs'

const initialJobs: Job[] = [
  { id: 'JF-104', title: 'Leaf cleanup and bagging', category: 'Yard', requestor: 'Mara Ellis', volunteer: 'Jonah R.', status: 'Awaiting parent', risk: 'Green', date: 'Today, 4:30 PM' },
  { id: 'JF-103', title: 'Dog walking, two afternoons', category: 'Pet services', requestor: 'Daniel Cho', volunteer: 'Unassigned', status: 'Ready to assign', risk: 'Yellow', date: 'Sat, Oct 12' },
  { id: 'JF-102', title: 'Church welcome table setup', category: 'Events', requestor: 'Grace Church', volunteer: 'Amelia T.', status: 'Payment pending', risk: 'Green', date: 'Oct 6, 9:00 AM' },
  { id: 'JF-101', title: 'Exterior car wash', category: 'Vehicle', requestor: 'Kevin Patel', volunteer: 'Noah B.', status: 'Needs review', risk: 'Green', date: 'Oct 14, 2:00 PM' },
]

const filterOptions: FilterValue[] = ['All jobs', 'Needs review', 'Awaiting parent', 'Ready to assign', 'Payment pending']
const categoryOptions = ['Yard', 'Pet services', 'Events', 'Vehicle']

const familyProfiles: Family[] = [
  { name: 'Mara Ellis', familyType: 'Service family', activeJobs: 2, totalRaised: 220, nextStep: 'Parent approval due' },
  { name: 'Daniel Cho', familyType: 'New family', activeJobs: 1, totalRaised: 90, nextStep: 'Assign volunteer' },
  { name: 'Grace Church', familyType: 'Group partner', activeJobs: 3, totalRaised: 360, nextStep: 'Payment confirmation' },
  { name: 'Kevin Patel', familyType: 'Returning family', activeJobs: 1, totalRaised: 140, nextStep: 'Safety review' },
]

const fundraisingMilestones = [
  { label: 'Roof repair fund', progress: 72, amount: '$2,160', target: '$3,000' },
  { label: 'Youth missions trip', progress: 48, amount: '$1,440', target: '$3,000' },
  { label: 'Community meals', progress: 81, amount: '$1,620', target: '$2,000' },
]

function App() {
  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window === 'undefined') return initialJobs

    try {
      const saved = window.localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as Job[]) : initialJobs
    } catch {
      return initialJobs
    }
  })
  const [activeView, setActiveView] = useState<ViewKey>('Overview')
  const [filter, setFilter] = useState<FilterValue>('All jobs')
  const [notice, setNotice] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: '',
    category: 'Yard' as Job['category'],
    requestor: '',
    volunteer: 'Unassigned',
    date: 'Today, 4:30 PM',
    risk: 'Green' as Job['risk'],
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(jobs))
    } catch {
      // ignore storage issues in restricted environments
    }
  }, [jobs])

  const filteredJobs = filter === 'All jobs' ? jobs : jobs.filter((job) => job.status === filter)
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const confirmPayment = (jobId: string) => {
    setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, status: 'Payment pending' } : job)))
    showNotice('Payment confirmed and added to the parent review queue.')
  }

  const advanceJob = (jobId: string) => {
    setJobs((current) =>
      current.map((job) => {
        if (job.id !== jobId) return job

        const flow: JobStatus[] = ['Needs review', 'Awaiting parent', 'Ready to assign', 'Payment pending']
        const currentIndex = flow.indexOf(job.status)
        const nextStatus = flow[(currentIndex + 1) % flow.length]

        return { ...job, status: nextStatus }
      }),
    )
    showNotice('Job moved to the next stage in the review flow.')
  }

  const handleDraftChange = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleCreateJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.title.trim() || !draft.requestor.trim()) {
      showNotice('Add a title and requestor before saving the job.')
      return
    }

    const lastJobNumber = jobs.reduce((max, job) => {
      const numericId = Number(job.id.replace(/\D/g, ''))
      return Math.max(max, numericId)
    }, 100)

    const newJob: Job = {
      id: `JF-${lastJobNumber + 1}`,
      title: draft.title.trim(),
      category: draft.category,
      requestor: draft.requestor.trim(),
      volunteer: draft.volunteer.trim() || 'Unassigned',
      status: 'Needs review',
      risk: draft.risk,
      date: draft.date,
    }

    setJobs((current) => [newJob, ...current])
    setFilter('All jobs')
    setDraft({
      title: '',
      category: 'Yard',
      requestor: '',
      volunteer: 'Unassigned',
      date: 'Today, 4:30 PM',
      risk: 'Green',
    })
    setIsCreateOpen(false)
    setActiveView('Overview')
    showNotice('New job added to the review queue.')
  }

  const renderOverview = () => (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sunday, October 13, 2024</p>
          <h1>Good morning, Jordan</h1>
          <p className="intro">Here is what needs your attention across the service exchange.</p>
        </div>
        <div className="date-pill">This week <span>⌄</span></div>
      </div>

      {notice && <div className="toast" role="status">✓ {notice}</div>}

      <div className="metric-grid">
        <article className="metric-card primary">
          <div className="metric-label"><span>Raised this month</span><span className="trend">↗ 18.4%</span></div>
          <strong>$1,840</strong>
          <div className="metric-foot"><span>of $3,000 monthly goal</span><div className="progress"><span style={{ width: '61%' }} /></div></div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Active jobs</span><span className="metric-icon green">◌</span></div>
          <strong>{jobs.length}</strong>
          <div className="metric-foot"><span className="good-text">{jobs.filter((job) => job.status !== 'Payment pending').length} need your review</span><span className="metric-arrow">→</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Participating youth</span><span className="metric-icon coral">♧</span></div>
          <strong>28</strong>
          <div className="metric-foot"><span>6 new this month</span><span className="metric-arrow">→</span></div>
        </article>
      </div>

      <div className="section-head">
        <div>
          <h2>Jobs needing attention</h2>
          <p>Keep every job moving safely through the loop.</p>
        </div>
        <button className="text-button" type="button" onClick={() => setActiveView('Jobs')}>View all jobs <span>→</span></button>
      </div>

      <div className="jobs-panel">
        <div className="filter-row">
          <div className="filters">
            {filterOptions.map((item) => (
              <button key={item} type="button" className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>
                {item}
                {item !== 'All jobs' && <span>{jobs.filter((job) => job.status === item).length}</span>}
              </button>
            ))}
          </div>
          <button className="filter-menu" type="button">Sort: newest <span>⌄</span></button>
        </div>

        <div className="job-list">
          {filteredJobs.map((job) => (
            <article className="job-row" key={job.id}>
              <div className="job-symbol">{job.category === 'Pet services' ? '♧' : job.category === 'Events' ? '✦' : '✳'}</div>
              <div className="job-info">
                <div className="job-title">
                  <strong>{job.title}</strong>
                  <span className="job-id">{job.id}</span>
                </div>
                <p>{job.requestor} <span>·</span> {job.date}</p>
              </div>
              <div className="job-person"><span className="mini-avatar">{job.volunteer === 'Unassigned' ? '?' : job.volunteer.slice(0, 2)}</span><span>{job.volunteer}</span></div>
              <span className={'risk ' + job.risk.toLowerCase()}><i />{job.risk} risk</span>
              <span className={'status ' + job.status.toLowerCase().replace(/ /g, '-')}>{job.status}</span>
              {job.status === 'Payment pending' ? (
                <button type="button" className="row-action" onClick={() => confirmPayment(job.id)}>Confirm payment</button>
              ) : (
                <button type="button" className="row-action ghost" onClick={() => advanceJob(job.id)}>Review <span>→</span></button>
              )}
            </article>
          ))}
        </div>

        {filteredJobs.length === 0 && <div className="empty-state">No jobs in this view.</div>}
      </div>

      <div className="lower-grid">
        <section className="activity">
          <div className="section-head compact">
            <div><h2>Recent activity</h2><p>A clear record for families and admins.</p></div>
            <button className="text-button" type="button">See history <span>→</span></button>
          </div>
          <div className="activity-list">
            <div><span className="activity-icon mint">✓</span><p><strong>Payment confirmed</strong><br /><span>Amelia's parent confirmed $60 from Grace Church</span></p><time>18 min</time></div>
            <div><span className="activity-icon blue">⌂</span><p><strong>New job request</strong><br /><span>Daniel Cho requested dog walking for Oct 12</span></p><time>1 hr</time></div>
            <div><span className="activity-icon peach">!</span><p><strong>Parent approval needed</strong><br /><span>Jonah R.'s guardian needs to review leaf cleanup</span></p><time>2 hr</time></div>
          </div>
        </section>

        <section className="safety-card">
          <div className="safety-head">
            <div><p className="eyebrow">Safety at a glance</p><h2>All systems clear</h2></div>
            <span className="shield">✓</span>
          </div>
          <p>Every active job has a current eligibility check and assigned contact.</p>
          <div className="safety-stats"><span><strong>12</strong> eligible jobs</span><span><strong>0</strong> open incidents</span></div>
          <button className="outline-button" type="button">Open safety log <span>→</span></button>
        </section>
      </div>
    </>
  )

  const renderJobsView = () => (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Job pipeline</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>+ New job</button>
      </div>

      <div className="jobs-table">
        <div className="jobs-table-head">
          <span>Job</span>
          <span>Requestor</span>
          <span>Volunteer</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {jobs.map((job) => (
          <div key={job.id} className="jobs-table-row">
            <div className="jobs-table-job">
              <span className="job-badge">{job.category === 'Pet services' ? '♧' : job.category === 'Events' ? '✦' : '✳'}</span>
              <div>
                <strong>{job.title}</strong>
                <small>{job.id}</small>
              </div>
            </div>
            <span>{job.requestor}</span>
            <span>{job.volunteer}</span>
            <span className={'pill ' + job.status.toLowerCase().replace(/ /g, '-')}>{job.status}</span>
            <div className="jobs-table-actions">
              <button type="button" className="ghost-link" onClick={() => setSelectedJobId(job.id)}>Details</button>
              <button type="button" className="mini-button" onClick={() => advanceJob(job.id)}>Next</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderFamilyView = () => (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">Families</p>
          <h2>Support roster</h2>
        </div>
        <button className="secondary-button" type="button">Export list</button>
      </div>

      <div className="family-grid">
        {familyProfiles.map((family) => (
          <article key={family.name} className="family-card">
            <div className="family-card-head">
              <span className="family-avatar">{family.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <div>
                <h3>{family.name}</h3>
                <small>{family.familyType}</small>
              </div>
            </div>
            <div className="family-stats">
              <div><strong>{family.activeJobs}</strong><span>Open jobs</span></div>
              <div><strong>${family.totalRaised}</strong><span>Raised</span></div>
            </div>
            <p>{family.nextStep}</p>
          </article>
        ))}
      </div>
    </div>
  )

  const renderFundraisingView = () => (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">Fundraising</p>
          <h2>Campaign progress</h2>
        </div>
        <button className="primary-button" type="button">+ Add goal</button>
      </div>

      <div className="fundraising-summary">
        <div className="summary-metric">
          <span>YTD raised</span>
          <strong>$5,320</strong>
        </div>
        <div className="summary-metric">
          <span>Goal</span>
          <strong>$8,500</strong>
        </div>
        <div className="summary-metric">
          <span>Donors</span>
          <strong>94</strong>
        </div>
      </div>

      <div className="milestone-list">
        {fundraisingMilestones.map((item) => (
          <div key={item.label} className="milestone-item">
            <div className="milestone-meta">
              <strong>{item.label}</strong>
              <span>{item.amount} of {item.target}</span>
            </div>
            <div className="progress-bar"><span style={{ width: `${item.progress}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">+</span><span>goodwork</span></div>
        <div className="church-switcher"><span className="church-avatar">GC</span><span><strong>Grace Community</strong><small>Church workspace</small></span><span className="chevron">⌄</span></div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          <button type="button" className={activeView === 'Overview' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Overview')}><span>▦</span>Overview</button>
          <button type="button" className={activeView === 'Jobs' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Jobs')}><span>◌</span>Jobs <b>{jobs.length}</b></button>
          <button type="button" className={activeView === 'Families' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Families')}><span>♧</span>Families</button>
          <button type="button" className={activeView === 'Fundraising' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Fundraising')}><span>◒</span>Fundraising</button>
          <p className="nav-label">Manage</p>
          <button className="nav-item" type="button"><span>✓</span>Approvals</button>
          <button className="nav-item" type="button"><span>⚙</span>Settings</button>
        </nav>
        <div className="sidebar-footer"><div className="user-chip"><span className="user-avatar">JM</span><span><strong>Jordan Miller</strong><small>Program admin</small></span><span className="more">•••</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Grace Community</span><span>/</span><strong>{activeView}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search" type="button">⌕</button>
            <button className="icon-button" aria-label="Notifications" type="button">♢<i></i></button>
            <button className="new-job" type="button" onClick={() => setIsCreateOpen(true)}>+ New job</button>
          </div>
        </header>

        <section className="content-wrap">
          {activeView === 'Overview' && renderOverview()}
          {activeView === 'Jobs' && renderJobsView()}
          {activeView === 'Families' && renderFamilyView()}
          {activeView === 'Fundraising' && renderFundraisingView()}
        </section>
      </main>

      {selectedJob && (
        <div className="detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
          <div className="detail-panel">
            <div className="detail-header">
              <div>
                <p className="eyebrow">Job detail</p>
                <h2 id="job-detail-title">{selectedJob.title}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setSelectedJobId(null)} aria-label="Close detail">✕</button>
            </div>

            <div className="detail-body">
              <div className="detail-summary">
                <span className="job-badge large">{selectedJob.category === 'Pet services' ? '♧' : selectedJob.category === 'Events' ? '✦' : '✳'}</span>
                <div>
                  <strong>{selectedJob.id}</strong>
                  <small>{selectedJob.category}</small>
                </div>
              </div>

              <dl className="detail-list">
                <div><dt>Requestor</dt><dd>{selectedJob.requestor}</dd></div>
                <div><dt>Volunteer</dt><dd>{selectedJob.volunteer}</dd></div>
                <div><dt>Status</dt><dd>{selectedJob.status}</dd></div>
                <div><dt>Risk</dt><dd>{selectedJob.risk}</dd></div>
                <div><dt>Date</dt><dd>{selectedJob.date}</dd></div>
              </dl>

              <div className="detail-actions">
                <button type="button" className="secondary-button" onClick={() => setSelectedJobId(null)}>Close</button>
                <button type="button" className="primary-button" onClick={() => advanceJob(selectedJob.id)}>Advance</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-job-title">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Create job</p>
                <h2 id="new-job-title">Add a service request</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setIsCreateOpen(false)} aria-label="Close">✕</button>
            </div>

            <form className="job-form" onSubmit={handleCreateJob}>
              <label>
                <span>Job title</span>
                <input value={draft.title} onChange={(event) => handleDraftChange('title', event.target.value)} placeholder="e.g. Leaf cleanup" />
              </label>

              <div className="form-row">
                <label>
                  <span>Category</span>
                  <select value={draft.category} onChange={(event) => handleDraftChange('category', event.target.value)}>
                    {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>

                <label>
                  <span>Risk</span>
                  <select value={draft.risk} onChange={(event) => handleDraftChange('risk', event.target.value)}>
                    <option value="Green">Green</option>
                    <option value="Yellow">Yellow</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Requestor</span>
                  <input value={draft.requestor} onChange={(event) => handleDraftChange('requestor', event.target.value)} placeholder="Family or group name" />
                </label>

                <label>
                  <span>Volunteer</span>
                  <input value={draft.volunteer} onChange={(event) => handleDraftChange('volunteer', event.target.value)} placeholder="Unassigned" />
                </label>
              </div>

              <label>
                <span>Date</span>
                <input value={draft.date} onChange={(event) => handleDraftChange('date', event.target.value)} />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
