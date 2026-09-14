import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ensurePocketBaseAuth, pb } from './lib/pocketbase'
import './App.css'
import './form.css'

type ViewKey = 'Overview' | 'Jobs' | 'Families' | 'Fundraising'
type JobStatus = 'Needs review' | 'Awaiting parent' | 'Ready to assign' | 'Payment pending'
type Job = {
  id: string
  title: string
  category: string
  requestor: string
  volunteer: string
  status: JobStatus
  risk: 'Green' | 'Yellow'
  date: string
  amount: number
  notes: string
}
type FilterValue = 'All jobs' | JobStatus

type FamilyStatus = 'Healthy' | 'Needs follow-up' | 'At risk'

type Family = {
  id: string
  name: string
  familyType: string
  activeJobs: number
  totalRaised: number
  nextStep: string
  contact: string
  status: FamilyStatus
}

type FundraisingGoal = {
  id: string
  label: string
  raised: number
  target: number
  status: 'On pace' | 'Ahead' | 'Needs attention'
}

type FamilyDraft = Omit<Family, 'id'>
type GoalDraft = Omit<FundraisingGoal, 'id'>

const jobsStorageKey = 'church-fund-raiser-jobs'
const familiesStorageKey = 'church-fund-raiser-families'
const goalsStorageKey = 'church-fund-raiser-goals'

const normalizeJobs = (records: Partial<Job>[]): Job[] =>
  records.map((job, index) => ({
    id: job.id ?? `JF-${index + 101}`,
    title: job.title ?? 'Untitled job',
    category: job.category ?? 'Yard',
    requestor: job.requestor ?? 'Unassigned',
    volunteer: job.volunteer ?? 'Unassigned',
    status: (job.status ?? 'Needs review') as JobStatus,
    risk: (job.risk ?? 'Green') as Job['risk'],
    date: job.date ?? 'Today',
    amount: job.amount ?? 0,
    notes: job.notes ?? 'No notes yet.',
  }))

const normalizeFamilies = (records: Partial<Family>[]): Family[] =>
  records.map((family, index) => ({
    id: family.id ?? `FAM-${index + 1}`,
    name: family.name ?? 'Family',
    familyType: family.familyType ?? 'Service family',
    activeJobs: family.activeJobs ?? 0,
    totalRaised: family.totalRaised ?? 0,
    nextStep: family.nextStep ?? 'Follow up this week',
    contact: family.contact ?? 'No contact listed',
    status: (family.status ?? 'Healthy') as FamilyStatus,
  }))

const normalizeGoals = (records: Partial<FundraisingGoal>[]): FundraisingGoal[] =>
  records.map((goal, index) => ({
    id: goal.id ?? `GOAL-${index + 1}`,
    label: goal.label ?? 'Fundraiser',
    raised: goal.raised ?? 0,
    target: goal.target ?? 100,
    status: (goal.status ?? 'On pace') as FundraisingGoal['status'],
  }))

const initialJobs: Job[] = [
  { id: 'JF-104', title: 'Leaf cleanup and bagging', category: 'Yard', requestor: 'Mara Ellis', volunteer: 'Jonah R.', status: 'Awaiting parent', risk: 'Green', date: 'Today, 4:30 PM', amount: 45, notes: 'Parent approval is pending for the schedule change.' },
  { id: 'JF-103', title: 'Dog walking, two afternoons', category: 'Pet services', requestor: 'Daniel Cho', volunteer: 'Unassigned', status: 'Ready to assign', risk: 'Yellow', date: 'Sat, Oct 12', amount: 60, notes: 'Needs a volunteer and a safety confirmation.' },
  { id: 'JF-102', title: 'Church welcome table setup', category: 'Events', requestor: 'Grace Church', volunteer: 'Amelia T.', status: 'Payment pending', risk: 'Green', date: 'Oct 6, 9:00 AM', amount: 80, notes: 'Payment was collected but waiting for final confirmation.' },
  { id: 'JF-101', title: 'Exterior car wash', category: 'Vehicle', requestor: 'Kevin Patel', volunteer: 'Noah B.', status: 'Needs review', risk: 'Green', date: 'Oct 14, 2:00 PM', amount: 35, notes: 'Budget and safety details need one final review.' },
]

const initialFamilies: Family[] = [
  { id: 'FAM-101', name: 'Mara Ellis', familyType: 'Service family', activeJobs: 2, totalRaised: 220, nextStep: 'Parent approval due', contact: 'mara.ellis@example.com', status: 'Needs follow-up' },
  { id: 'FAM-102', name: 'Daniel Cho', familyType: 'New family', activeJobs: 1, totalRaised: 90, nextStep: 'Assign volunteer', contact: 'daniel.cho@example.com', status: 'Healthy' },
  { id: 'FAM-103', name: 'Grace Church', familyType: 'Group partner', activeJobs: 3, totalRaised: 360, nextStep: 'Payment confirmation', contact: 'hello@gracechurch.org', status: 'Healthy' },
  { id: 'FAM-104', name: 'Kevin Patel', familyType: 'Returning family', activeJobs: 1, totalRaised: 140, nextStep: 'Safety review', contact: 'kevin.patel@example.com', status: 'At risk' },
]

const initialGoals: FundraisingGoal[] = [
  { id: 'GOAL-101', label: 'Roof repair fund', raised: 2160, target: 3000, status: 'On pace' },
  { id: 'GOAL-102', label: 'Youth missions trip', raised: 1440, target: 3000, status: 'Needs attention' },
  { id: 'GOAL-103', label: 'Community meals', raised: 1620, target: 2000, status: 'Ahead' },
]

const filterOptions: FilterValue[] = ['All jobs', 'Needs review', 'Awaiting parent', 'Ready to assign', 'Payment pending']
const categoryOptions = ['Yard', 'Pet services', 'Events', 'Vehicle']

const defaultFamilyDraft: FamilyDraft = {
  name: '',
  familyType: 'Service family',
  activeJobs: 0,
  totalRaised: 0,
  nextStep: 'Follow up this week',
  contact: '',
  status: 'Healthy',
}

const defaultGoalDraft: GoalDraft = {
  label: '',
  raised: 0,
  target: 1000,
  status: 'On pace',
}

function App() {
  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window === 'undefined') return initialJobs

    try {
      const saved = window.localStorage.getItem(jobsStorageKey)
      return saved ? normalizeJobs(JSON.parse(saved) as Partial<Job>[]) : initialJobs
    } catch {
      return initialJobs
    }
  })

  const [families, setFamilies] = useState<Family[]>(() => {
    if (typeof window === 'undefined') return initialFamilies

    try {
      const saved = window.localStorage.getItem(familiesStorageKey)
      return saved ? normalizeFamilies(JSON.parse(saved) as Partial<Family>[]) : initialFamilies
    } catch {
      return initialFamilies
    }
  })

  const [goals, setGoals] = useState<FundraisingGoal[]>(() => {
    if (typeof window === 'undefined') return initialGoals

    try {
      const saved = window.localStorage.getItem(goalsStorageKey)
      return saved ? normalizeGoals(JSON.parse(saved) as Partial<FundraisingGoal>[]) : initialGoals
    } catch {
      return initialGoals
    }
  })

  const [activeView, setActiveView] = useState<ViewKey>('Overview')
  const [filter, setFilter] = useState<FilterValue>('All jobs')
  const [notice, setNotice] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isEditingJob, setIsEditingJob] = useState(false)
  const [detailDraft, setDetailDraft] = useState<Job | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: '',
    category: 'Yard' as Job['category'],
    requestor: '',
    volunteer: 'Unassigned',
    date: 'Today, 4:30 PM',
    risk: 'Green' as Job['risk'],
  })
  const [familyDraft, setFamilyDraft] = useState<FamilyDraft>(defaultFamilyDraft)
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null)
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false)
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(defaultGoalDraft)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(jobsStorageKey, JSON.stringify(normalizeJobs(jobs)))
    } catch {
      // ignore storage issues in restricted environments
    }
  }, [jobs])

  useEffect(() => {
    try {
      window.localStorage.setItem(familiesStorageKey, JSON.stringify(normalizeFamilies(families)))
    } catch {
      // ignore storage issues in restricted environments
    }
  }, [families])

  useEffect(() => {
    try {
      window.localStorage.setItem(goalsStorageKey, JSON.stringify(normalizeGoals(goals)))
    } catch {
      // ignore storage issues in restricted environments
    }
  }, [goals])

  useEffect(() => {
    setDetailDraft(selectedJob ?? null)
    setIsEditingJob(false)
  }, [selectedJobId, jobs])

  useEffect(() => {
    const loadFromDb = async () => {
      try {
        await ensurePocketBaseAuth()

        const [jobData, familyData, goalData] = await Promise.all([
          pb.collection('jobs').getFullList({ sort: '-created' }),
          pb.collection('families').getFullList({ sort: '-created' }),
          pb.collection('fundraising_goals').getFullList({ sort: '-created' }),
        ])

        if (jobData.length) setJobs(normalizeJobs(jobData as Partial<Job>[]))
        if (familyData.length) setFamilies(normalizeFamilies(familyData as Partial<Family>[]))
        if (goalData.length) setGoals(normalizeGoals(goalData as Partial<FundraisingGoal>[]))
      } catch {
        // allow the app to continue in local/demo mode if PocketBase is not yet initialized
      }
    }

    void loadFromDb()
  }, [])

  const filteredJobs = filter === 'All jobs' ? jobs : jobs.filter((job) => job.status === filter)
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])
  const totalRaised = goals.reduce((sum, goal) => sum + goal.raised, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const confirmPayment = (jobId: string) => {
    const nextJobs = jobs.map((job) => (job.id === jobId ? { ...job, status: 'Payment pending' as JobStatus } : job))
    setJobs(nextJobs)

    try {
      const currentJob = nextJobs.find((job) => job.id === jobId)
      if (currentJob) {
        void pb.collection('jobs').update(jobId, {
          status: currentJob.status,
        })
      }
    } catch {
      // ignore database update failures and keep local state responsive
    }

    showNotice('Payment confirmed and added to the parent review queue.')
  }

  const advanceJob = (jobId: string) => {
    const nextJobs = jobs.map((job) => {
      if (job.id !== jobId) return job

      const flow: JobStatus[] = ['Needs review', 'Awaiting parent', 'Ready to assign', 'Payment pending']
      const currentIndex = flow.indexOf(job.status)
      const nextStatus = flow[(currentIndex + 1) % flow.length]

      return { ...job, status: nextStatus }
    })

    setJobs(nextJobs)

    try {
      const currentJob = nextJobs.find((job) => job.id === jobId)
      if (currentJob) {
        void pb.collection('jobs').update(jobId, {
          status: currentJob.status,
        })
      }
    } catch {
      // ignore database update failures and keep local state responsive
    }

    showNotice('Job moved to the next stage in the review flow.')
  }

  const handleDraftChange = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleDetailDraftChange = <K extends keyof Job>(field: K, value: Job[K]) => {
    setDetailDraft((current) => (current ? { ...current, [field]: value } : current))
  }

  const saveDetailChanges = () => {
    if (!detailDraft) return

    const updatedJobs = jobs.map((job) => (job.id === detailDraft.id ? detailDraft : job))
    setJobs(updatedJobs)

    try {
      void pb.collection('jobs').update(detailDraft.id, {
        title: detailDraft.title,
        category: detailDraft.category,
        requestor: detailDraft.requestor,
        volunteer: detailDraft.volunteer,
        status: detailDraft.status,
        risk: detailDraft.risk,
        date: detailDraft.date,
        amount: detailDraft.amount,
        notes: detailDraft.notes,
      })
    } catch {
      // ignore database update failures and keep local state responsive
    }

    setSelectedJobId(detailDraft.id)
    setIsEditingJob(false)
    showNotice('Job details saved.')
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
      amount: 0,
      notes: 'No notes yet.',
    }

    setJobs((current) => [newJob, ...current])

    try {
      void pb.collection('jobs').create({
        id: newJob.id,
        title: newJob.title,
        category: newJob.category,
        requestor: newJob.requestor,
        volunteer: newJob.volunteer,
        status: newJob.status,
        risk: newJob.risk,
        date: newJob.date,
        amount: newJob.amount,
        notes: newJob.notes,
      })
    } catch {
      // ignore database write failures and keep local state responsive
    }

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

  const handleSaveFamily = () => {
    if (!familyDraft.name.trim()) {
      showNotice('Add a family name before saving the record.')
      return
    }

    if (editingFamilyId) {
      const nextFamilies = families.map((family) => (family.id === editingFamilyId ? { ...family, ...familyDraft } : family))
      setFamilies(nextFamilies)

      try {
        void pb.collection('families').update(editingFamilyId, { ...familyDraft })
      } catch {
        // ignore database update failures and keep local state responsive
      }

      showNotice('Family profile updated.')
    } else {
      const nextId = `FAM-${Date.now()}`
      const record = { id: nextId, ...familyDraft }
      setFamilies((current) => [record, ...current])

      try {
        void pb.collection('families').create({
          id: record.id,
          name: record.name,
          familyType: record.familyType,
          activeJobs: record.activeJobs,
          totalRaised: record.totalRaised,
          nextStep: record.nextStep,
          contact: record.contact,
          status: record.status,
        })
      } catch {
        // ignore database write failures and keep local state responsive
      }

      showNotice('Family record added.')
    }

    setIsFamilyModalOpen(false)
    setFamilyDraft(defaultFamilyDraft)
    setEditingFamilyId(null)
  }

  const handleSaveGoal = () => {
    if (!goalDraft.label.trim()) {
      showNotice('Add a goal title before saving.')
      return
    }

    if (editingGoalId) {
      const nextGoals = goals.map((goal) => (goal.id === editingGoalId ? { ...goal, ...goalDraft } : goal))
      setGoals(nextGoals)

      try {
        void pb.collection('fundraising_goals').update(editingGoalId, { ...goalDraft })
      } catch {
        // ignore database update failures and keep local state responsive
      }

      showNotice('Goal updated.')
    } else {
      const nextId = `GOAL-${Date.now()}`
      const record = { id: nextId, ...goalDraft }
      setGoals((current) => [record, ...current])

      try {
        void pb.collection('fundraising_goals').create({
          id: record.id,
          label: record.label,
          raised: record.raised,
          target: record.target,
          status: record.status,
        })
      } catch {
        // ignore database write failures and keep local state responsive
      }

      showNotice('Fundraising goal added.')
    }

    setIsGoalModalOpen(false)
    setGoalDraft(defaultGoalDraft)
    setEditingGoalId(null)
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
          <strong>${totalRaised}</strong>
          <div className="metric-foot"><span>of ${totalTarget} campaign target</span><div className="progress"><span style={{ width: `${Math.min(100, Math.round((totalRaised / totalTarget) * 100))}%` }} /></div></div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Active jobs</span><span className="metric-icon green">◌</span></div>
          <strong>{jobs.length}</strong>
          <div className="metric-foot"><span className="good-text">{jobs.filter((job) => job.status !== 'Payment pending').length} need your review</span><span className="metric-arrow">→</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Open families</span><span className="metric-icon coral">♧</span></div>
          <strong>{families.length}</strong>
          <div className="metric-foot"><span>{families.filter((family) => family.status === 'Needs follow-up').length} need follow-up</span><span className="metric-arrow">→</span></div>
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
        <div className="view-actions">
          <button className="secondary-button" type="button">Export list</button>
          <button className="primary-button" type="button" onClick={() => { setEditingFamilyId(null); setFamilyDraft(defaultFamilyDraft); setIsFamilyModalOpen(true) }}>+ Add family</button>
        </div>
      </div>

      <div className="family-grid">
        {families.map((family) => (
          <article key={family.id} className="family-card">
            <div className="family-card-head">
              <span className="family-avatar">{family.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <div>
                <h3>{family.name}</h3>
                <small>{family.familyType}</small>
              </div>
            </div>
            <div className="family-status-row">
              <span className={'status-pill ' + family.status.toLowerCase().replace(/\s+/g, '-')}>{family.status}</span>
            </div>
            <div className="family-stats">
              <div><strong>{family.activeJobs}</strong><span>Open jobs</span></div>
              <div><strong>${family.totalRaised}</strong><span>Raised</span></div>
            </div>
            <p className="family-note">{family.nextStep}</p>
            <p className="family-contact">Contact: {family.contact}</p>
            <div className="family-card-actions">
              <button type="button" className="secondary-button small" onClick={() => { setEditingFamilyId(family.id); setFamilyDraft({ ...family }); setIsFamilyModalOpen(true) }}>Edit</button>
              <button type="button" className="ghost-link" onClick={() => setFamilies((current) => current.filter((item) => item.id !== family.id))}>Remove</button>
            </div>
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
        <button className="primary-button" type="button" onClick={() => { setEditingGoalId(null); setGoalDraft(defaultGoalDraft); setIsGoalModalOpen(true) }}>+ Add goal</button>
      </div>

      <div className="fundraising-summary">
        <div className="summary-metric">
          <span>YTD raised</span>
          <strong>${totalRaised}</strong>
        </div>
        <div className="summary-metric">
          <span>Goal</span>
          <strong>${totalTarget}</strong>
        </div>
        <div className="summary-metric">
          <span>Donors</span>
          <strong>{Math.max(20, goals.length * 14)}</strong>
        </div>
      </div>

      <div className="milestone-list">
        {goals.map((item) => {
          const progress = Math.min(100, Math.round((item.raised / item.target) * 100))
          return (
            <div key={item.id} className="milestone-item">
              <div className="milestone-meta">
                <div className="milestone-title-block">
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                </div>
                <span>${item.raised} of ${item.target}</span>
              </div>
              <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
              <div className="goal-card-actions">
                <button type="button" className="secondary-button small" onClick={() => { setEditingGoalId(item.id); setGoalDraft({ ...item }); setIsGoalModalOpen(true) }}>Edit</button>
                <button type="button" className="ghost-link" onClick={() => setGoals((current) => current.filter((goal) => goal.id !== item.id))}>Remove</button>
              </div>
            </div>
          )
        })}
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

      {selectedJob && detailDraft && (
        <div className="detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
          <div className="detail-panel">
            <div className="detail-header">
              <div>
                <p className="eyebrow">Job detail</p>
                <h2 id="job-detail-title">{isEditingJob ? 'Edit job' : detailDraft.title}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setSelectedJobId(null)} aria-label="Close detail">✕</button>
            </div>

            <div className="detail-body">
              {!isEditingJob ? (
                <>
                  <div className="detail-summary">
                    <span className="job-badge large">{detailDraft.category === 'Pet services' ? '♧' : detailDraft.category === 'Events' ? '✦' : '✳'}</span>
                    <div>
                      <strong>{detailDraft.id}</strong>
                      <small>{detailDraft.category}</small>
                    </div>
                  </div>

                  <dl className="detail-list">
                    <div><dt>Requestor</dt><dd>{detailDraft.requestor}</dd></div>
                    <div><dt>Volunteer</dt><dd>{detailDraft.volunteer}</dd></div>
                    <div><dt>Status</dt><dd>{detailDraft.status}</dd></div>
                    <div><dt>Risk</dt><dd>{detailDraft.risk}</dd></div>
                    <div><dt>Amount</dt><dd>${detailDraft.amount}</dd></div>
                    <div><dt>Date</dt><dd>{detailDraft.date}</dd></div>
                  </dl>

                  <div className="detail-notes">
                    <h3>Notes</h3>
                    <p>{detailDraft.notes}</p>
                  </div>

                  <div className="detail-actions">
                    <button type="button" className="secondary-button" onClick={() => setSelectedJobId(null)}>Close</button>
                    <button type="button" className="secondary-button" onClick={() => setIsEditingJob(true)}>Edit</button>
                    <button type="button" className="primary-button" onClick={() => advanceJob(detailDraft.id)}>Advance</button>
                  </div>
                </>
              ) : (
                <div className="detail-form">
                  <div className="field-row">
                    <label className="field-group">
                      <span>Title</span>
                      <input value={detailDraft.title} onChange={(event) => handleDetailDraftChange('title', event.target.value)} />
                    </label>
                    <label className="field-group">
                      <span>Status</span>
                      <select value={detailDraft.status} onChange={(event) => handleDetailDraftChange('status', event.target.value as JobStatus)}>
                        {filterOptions.filter((option) => option !== 'All jobs').map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field-group">
                      <span>Requestor</span>
                      <input value={detailDraft.requestor} onChange={(event) => handleDetailDraftChange('requestor', event.target.value)} />
                    </label>
                    <label className="field-group">
                      <span>Volunteer</span>
                      <input value={detailDraft.volunteer} onChange={(event) => handleDetailDraftChange('volunteer', event.target.value)} />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field-group">
                      <span>Category</span>
                      <select value={detailDraft.category} onChange={(event) => handleDetailDraftChange('category', event.target.value)}>
                        {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="field-group">
                      <span>Risk</span>
                      <select value={detailDraft.risk} onChange={(event) => handleDetailDraftChange('risk', event.target.value as Job['risk'])}>
                        <option value="Green">Green</option>
                        <option value="Yellow">Yellow</option>
                      </select>
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field-group">
                      <span>Amount</span>
                      <input type="number" value={detailDraft.amount} onChange={(event) => handleDetailDraftChange('amount', Number(event.target.value) || 0)} />
                    </label>
                    <label className="field-group">
                      <span>Date</span>
                      <input value={detailDraft.date} onChange={(event) => handleDetailDraftChange('date', event.target.value)} />
                    </label>
                  </div>

                  <label className="field-group full-width">
                    <span>Notes</span>
                    <textarea value={detailDraft.notes} rows={4} onChange={(event) => handleDetailDraftChange('notes', event.target.value)} />
                  </label>

                  <div className="detail-actions">
                    <button type="button" className="secondary-button" onClick={() => setIsEditingJob(false)}>Cancel</button>
                    <button type="button" className="primary-button" onClick={saveDetailChanges}>Save</button>
                  </div>
                </div>
              )}
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

      {isFamilyModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="family-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Family record</p>
                <h2 id="family-modal-title">{editingFamilyId ? 'Edit family' : 'Add family'}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setIsFamilyModalOpen(false)} aria-label="Close family form">✕</button>
            </div>

            <form className="job-form" onSubmit={(event) => { event.preventDefault(); handleSaveFamily() }}>
              <label>
                <span>Family name</span>
                <input value={familyDraft.name} onChange={(event) => setFamilyDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>

              <div className="form-row">
                <label>
                  <span>Type</span>
                  <input value={familyDraft.familyType} onChange={(event) => setFamilyDraft((current) => ({ ...current, familyType: event.target.value }))} />
                </label>
                <label>
                  <span>Status</span>
                  <select value={familyDraft.status} onChange={(event) => setFamilyDraft((current) => ({ ...current, status: event.target.value as Family['status'] }))}>
                    <option value="Healthy">Healthy</option>
                    <option value="Needs follow-up">Needs follow-up</option>
                    <option value="At risk">At risk</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Open jobs</span>
                  <input type="number" value={familyDraft.activeJobs} onChange={(event) => setFamilyDraft((current) => ({ ...current, activeJobs: Number(event.target.value) || 0 }))} />
                </label>
                <label>
                  <span>Raised</span>
                  <input type="number" value={familyDraft.totalRaised} onChange={(event) => setFamilyDraft((current) => ({ ...current, totalRaised: Number(event.target.value) || 0 }))} />
                </label>
              </div>

              <label>
                <span>Contact</span>
                <input value={familyDraft.contact} onChange={(event) => setFamilyDraft((current) => ({ ...current, contact: event.target.value }))} />
              </label>

              <label>
                <span>Next step</span>
                <input value={familyDraft.nextStep} onChange={(event) => setFamilyDraft((current) => ({ ...current, nextStep: event.target.value }))} />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsFamilyModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save family</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGoalModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Fundraising goal</p>
                <h2 id="goal-modal-title">{editingGoalId ? 'Edit goal' : 'Add goal'}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setIsGoalModalOpen(false)} aria-label="Close goal form">✕</button>
            </div>

            <form className="job-form" onSubmit={(event) => { event.preventDefault(); handleSaveGoal() }}>
              <label>
                <span>Goal name</span>
                <input value={goalDraft.label} onChange={(event) => setGoalDraft((current) => ({ ...current, label: event.target.value }))} />
              </label>

              <div className="form-row">
                <label>
                  <span>Raised</span>
                  <input type="number" value={goalDraft.raised} onChange={(event) => setGoalDraft((current) => ({ ...current, raised: Number(event.target.value) || 0 }))} />
                </label>
                <label>
                  <span>Target</span>
                  <input type="number" value={goalDraft.target} onChange={(event) => setGoalDraft((current) => ({ ...current, target: Number(event.target.value) || 0 }))} />
                </label>
              </div>

              <label>
                <span>Status</span>
                <select value={goalDraft.status} onChange={(event) => setGoalDraft((current) => ({ ...current, status: event.target.value as FundraisingGoal['status'] }))}>
                  <option value="On pace">On pace</option>
                  <option value="Ahead">Ahead</option>
                  <option value="Needs attention">Needs attention</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsGoalModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
