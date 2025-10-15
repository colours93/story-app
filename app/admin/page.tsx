'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BookOpen, Users, Calendar, Eye, Trash2, UserPlus, FileText, Image as ImageIcon } from 'lucide-react'
import { ChapterManagementPanel } from '@/components/chapter-management-panel'
import Link from 'next/link'

interface Story {
  id: string
  title: string
  description: string
  user_id: string
  created_at: string
  updated_at: string
  is_published: boolean
  chapter_count?: number
}

interface User {
  id: string
  username: string
  email: string
  role: string
  created_at: string
}

interface DashboardStats {
  totalStories: number
  totalUsers: number
  publishedStories: number
  draftStories: number
}

interface Assignment {
  id: string
  user_id: string
  story_id: string
  assigned_at: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    totalUsers: 0,
    publishedStories: 0,
    draftStories: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [chapterManagementOpen, setChapterManagementOpen] = useState(false)

  useEffect(() => {
    // Rely on middleware for route protection to avoid client-side redirect loops.
    // Only fetch data once the session is confirmed and the user is admin.
    if (status !== 'authenticated') return
    if (!session || session.user.role !== 'admin') return

    fetchDashboardData()
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch stories
      const storiesResponse = await fetch('/api/admin/stories')
      if (!storiesResponse.ok) throw new Error('Failed to fetch stories')
      const storiesData = await storiesResponse.json()
      
      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()
      
      // Fetch assignments
      const assignmentsResponse = await fetch('/api/admin/assignments')
      if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments')
      const assignmentsData = await assignmentsResponse.json()
      
      setStories(storiesData)
      setUsers(usersData)
      setAssignments(assignmentsData)
      
      // Calculate stats
      const publishedCount = storiesData.filter((story: Story) => story.is_published).length
      setStats({
        totalStories: storiesData.length,
        totalUsers: usersData.length,
        publishedStories: publishedCount,
        draftStories: storiesData.length - publishedCount
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignStory = async () => {
    if (!selectedStoryId || !selectedUserId) {
      alert('Please select both a story and a user')
      return
    }

    setAssignmentLoading(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          story_id: selectedStoryId,
          user_id: selectedUserId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign story')
      }

      // Reset form and close dialog
      setSelectedStoryId('')
      setSelectedUserId('')
      setAssignmentDialogOpen(false)
      
      // Refresh data
      fetchDashboardData()
      
      alert('Story assigned successfully!')
    } catch (err) {
      alert('Failed to assign story: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setAssignmentLoading(false)
    }
  }

  const getAssignedUsers = (storyId: string) => {
    const storyAssignments = assignments.filter(a => a.story_id === storyId)
    return storyAssignments.map(a => {
      const user = users.find(u => u.id === a.user_id)
      return user ? user.username : 'Unknown User'
    }).join(', ')
  }

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return
    
    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete story')
      
      // Refresh data
      fetchDashboardData()
    } catch (err) {
      alert('Failed to delete story: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading dashboard: {error}</p>
              <Button onClick={fetchDashboardData} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show chapter management view if active
  if (chapterManagementOpen) {
    return <ChapterManagementPanel onBack={() => setChapterManagementOpen(false)} />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage stories and users</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/gallery">
            <Button variant="outline">
              <ImageIcon className="h-4 w-4 mr-2" />
              Site Gallery
            </Button>
          </Link>
          <Button onClick={() => setChapterManagementOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Manage Chapters
          </Button>
          <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Story
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Story to User</DialogTitle>
                <DialogDescription>
                  Select a story and user to create an assignment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Story</label>
                  <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a story" />
                    </SelectTrigger>
                    <SelectContent>
                      {stories.map((story) => (
                        <SelectItem key={story.id} value={story.id}>
                          {story.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(user => user.role !== 'admin').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setAssignmentDialogOpen(false)}
                    disabled={assignmentLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignStory}
                    disabled={assignmentLoading || !selectedStoryId || !selectedUserId}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Story'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchDashboardData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStories}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedStories}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftStories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Stories</CardTitle>
          <CardDescription>
            Manage all stories in the system and their assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stories found
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{story.title}</h3>
                      <Badge variant={story.is_published ? "default" : "secondary"}>
                        {story.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {story.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {formatDate(story.created_at)}</span>
                      <span>Updated: {formatDate(story.updated_at)}</span>
                      <span>Author ID: {story.user_id}</span>
                    </div>
                    {getAssignedUsers(story.id) && (
                      <div className="text-xs text-blue-600">
                        Assigned to: {getAssignedUsers(story.id)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/story`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Latest registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}