import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getAllChapters } from "@/lib/story-parser"
import path from "path"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true })

    if (storiesError) {
      console.error("Failed to load stories:", storiesError)
      return NextResponse.json({ error: "Failed to load stories" }, { status: 500 })
    }

    const storyFilePath = path.join(process.cwd(), "story.md")
    const defaultChapters = getAllChapters(storyFilePath)

    let storyId = stories && stories.length > 0 ? stories[0].id : null

    if (!storyId) {
      if (defaultChapters.length === 0) {
        return NextResponse.json({ error: "No chapters available" }, { status: 500 })
      }

      const { data: newStory, error: storyError } = await supabase
        .from("stories")
        .insert({
          title: "Dawn's Molten Journey - Complete Story",
          slug: "dawns-molten-journey-complete",
          description: "A captivating story of passion and discovery in Szeged - Complete story with all 10 chapters",
          user_id: session.user.id,
          is_published: false
        })
        .select()
        .single()

      if (storyError || !newStory) {
        console.error("Failed to create default story:", storyError)
        return NextResponse.json({ error: "Failed to create default story" }, { status: 500 })
      }

      storyId = newStory.id

      const chaptersToInsert = defaultChapters.map((chapter) => ({
        story_id: newStory.id,
        chapter_number: chapter.id,
        title: chapter.title,
        content: chapter.content,
        user_id: session.user.id
      }))

      const { error: insertError } = await supabase
        .from("chapters")
        .insert(chaptersToInsert)

      if (insertError) {
        console.error("Failed to seed chapters:", insertError)
        return NextResponse.json({ error: "Failed to seed chapters" }, { status: 500 })
      }
    }

    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("id, story_id, chapter_number, title, content")
      .eq("story_id", storyId)
      .eq("user_id", session.user.id)
      .order("chapter_number", { ascending: true })

    if (chaptersError) {
      console.error("Failed to load chapters:", chaptersError)
      return NextResponse.json({ error: "Failed to load chapters" }, { status: 500 })
    }

    let finalChapters = chapters ?? []

    if (finalChapters.length < 10 && defaultChapters.length > 0) {
      const existingNumbers = new Set(finalChapters.map((chapter) => chapter.chapter_number))
      const missingChapters = defaultChapters.filter((chapter) => !existingNumbers.has(chapter.id))

      if (missingChapters.length > 0) {
        const chaptersToInsert = missingChapters.map((chapter) => ({
          story_id: storyId,
          chapter_number: chapter.id,
          title: chapter.title,
          content: chapter.content,
          user_id: session.user.id
        }))

        const { error: missingInsertError } = await supabase
          .from("chapters")
          .insert(chaptersToInsert)

        if (missingInsertError) {
          console.error("Failed to insert missing chapters:", missingInsertError)
          return NextResponse.json({ error: "Failed to insert missing chapters" }, { status: 500 })
        }

        const { data: refreshedChapters, error: refreshError } = await supabase
          .from("chapters")
          .select("id, story_id, chapter_number, title, content")
          .eq("story_id", storyId)
          .eq("user_id", session.user.id)
          .order("chapter_number", { ascending: true })

        if (refreshError) {
          console.error("Failed to refresh chapters:", refreshError)
          return NextResponse.json({ error: "Failed to refresh chapters" }, { status: 500 })
        }

        finalChapters = refreshedChapters ?? finalChapters
      }
    }

    return NextResponse.json({ chapters: finalChapters })
  } catch (error) {
    console.error("Admin chapters API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
