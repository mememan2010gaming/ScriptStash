import { useState } from 'react'
import Titlebar from './Titlebar'
import Sidebar from './Sidebar'
import Header from './Header'
import TopicList from '../topics/TopicList'
import TopicDetail from '../topics/TopicDetail'
import DownloadsView from '../downloads/DownloadsView'
import SearchView from '../search/SearchView'
import SettingsView from '../settings/SettingsView'
import './AppShell.css'

function ViewContent({ currentView, currentCategory, selectedTopicId, searchQuery, navigateTo }) {
  switch (currentView) {
    case 'topics':
      return <TopicList category={currentCategory} navigateTo={navigateTo} />
    case 'detail':
      return <TopicDetail topicId={selectedTopicId} navigateTo={navigateTo} />
    case 'downloads':
      return <DownloadsView />
    case 'search':
      return <SearchView query={searchQuery} navigateTo={navigateTo} />
    case 'settings':
      return <SettingsView />
    default:
      return <TopicList category="free" navigateTo={navigateTo} />
  }
}

export default function AppShell({
  currentView,
  currentCategory,
  selectedTopicId,
  searchQuery,
  navigateTo,
  goBack,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Titlebar />
      <div className="app-body">
        <Sidebar
          currentView={currentView}
          currentCategory={currentCategory}
          navigateTo={navigateTo}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header
            currentView={currentView}
            searchQuery={searchQuery}
            navigateTo={navigateTo}
            goBack={goBack}
          />
          <div className="app-content">
            <ViewContent
              currentView={currentView}
              currentCategory={currentCategory}
              selectedTopicId={selectedTopicId}
              searchQuery={searchQuery}
              navigateTo={navigateTo}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
