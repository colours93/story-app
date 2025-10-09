'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Story, StoryAssignment } from '@/lib/supabase'
import { Trash2, UserPlus, BookOpen, Users } from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [assignments, setAssignments] = useState<StoryAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New user form
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  })

  // New story form
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    image_url: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch users
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      if (usersRes.ok) setUsers(usersData)

      // Fetch stories
      const storiesRes = await fetch('/api/admin/stories')
      const storiesData = await storiesRes.json()
      if (storiesRes.ok) setStories(storiesData)

      // Fetch assignments
      const assignmentsRes = await fetch('/api/admin/assignments')
      const assignmentsData = await assignmentsRes.json()
      if (assignmentsRes.ok) setAssignments(assignmentsData)

    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (res.ok) {
        setSuccess('User created successfully')
        setNewUser({ username: '', email: '', password: '', role: 'user' })
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError('Failed to create user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('User deleted successfully')
        fetchData()
      } else {
        setError('Failed to delete user')
      }
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const createStory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory)
      })

      if (res.ok) {
        setSuccess('Story created successfully')
        setNewStory({ title: '', content: '', image_url: '' })
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create story')
      }
    } catch (err) {
      setError('Failed to create story')
    }
  }

  const deleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return

    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Story deleted successfully')
        fetchData()
      } else {
        setError('Failed to delete story')
      }
    } catch (err) {
      setError('Failed to delete story')
    }
  }

  const assignStory = async (userId: string, storyId: string) => {
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, story_id: storyId })
      })

      if (res.ok) {
        setSuccess('Story assigned successfully')
        fetchData()
      } else {
        setError('Failed to assign story')
      }
    } catch (err) {
      setError('Failed to assign story')
    }
  }

  const unassignStory = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Story unassigned successfully')
        fetchData()
      } else {
        setError('Failed to unassign story')
      }
    } catch (err) {
      setError('Failed to unassign story')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, stories, and assignments</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{user.username}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <CardTitle>Stories Management</CardTitle>
                <CardDescription>Manage story content and images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{story.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{story.content}</p>
                        {story.image_url && (
                          <img src={story.image_url} alt={story.title} className="w-16 h-16 object-cover rounded mt-2" />
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Story Assignments</CardTitle>
                <CardDescription>Manage which users can access which stories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const user = users.find(u => u.id === assignment.user_id)
                    const story = stories.find(s => s.id === assignment.story_id)
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{user?.username} → {story?.title}</h3>
                          <p className="text-sm text-gray-600">
                            Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => unassignStory(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-4">Assign Story to User</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Select User</Label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          onChange={(e) => {
                            const userId = e.target.value
                            const storySelect = document.getElementById('story-select') as HTMLSelectElement
                            if (userId && storySelect.value) {
                              assignStory(userId, storySelect.value)
                            }
                          }}
                        >
                          <option value="">Choose user...</option>
                          {users.filter(u => u.role === 'user').map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Select Story</Label>
                        <select 
                          id="story-select"
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Choose story...</option>
                          {stories.map(story => (
                            <option key={story.id} value={story.id}>{story.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create New User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createUser} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        className="w-full p-2 border rounded-md"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as 'user' | 'admin'})}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">Create User</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Create New Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createStory} className="space-y-4">
                    <div>
                      <Label htmlFor="story-title">Title</Label>
                      <Input
                        id="story-title"
                        value={newStory.title}
                        onChange={(e) => setNewStory({...newStory, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="story-content">Content</Label>
                      <textarea
                        id="story-content"
                        className="w-full p-2 border rounded-md h-32"
                        value={newStory.content}
                        onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="story-image">Image URL</Label>
                      <Input
                        id="story-image"
                        type="url"
                        value={newStory.image_url}
                        onChange={(e) => setNewStory({...newStory, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <Button type="submit" className="w-full">Create Story</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}