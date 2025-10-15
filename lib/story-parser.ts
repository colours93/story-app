import fs from 'fs'
import path from 'path'

export interface Chapter {
  id: number
  title: string
  content: string
}

export function parseStoryFile(filePath: string): Chapter[] {
  try {
    const storyContent = fs.readFileSync(filePath, 'utf-8')
    
    const chapters: Chapter[] = []
    
    // Simple regex to match chapters with their titles and content
    const chapterRegex = /Chapter\s+(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten):\s*([^🌹💗]+?)(?:[🌹💗]|$)/gi
    let match
    
    while ((match = chapterRegex.exec(storyContent)) !== null) {
      const numberWord = match[1]
      const fullText = match[2].trim()
      
      // Extract title (first few words before the main content)
      const titleMatch = fullText.match(/^([^.!?]*[.!?]?)/)
      const title = titleMatch ? `Chapter ${getChapterNumber(numberWord)}: ${titleMatch[1].trim()}` : `Chapter ${getChapterNumber(numberWord)}`
      
      // Content is everything after the title
      const content = titleMatch ? fullText.substring(titleMatch[1].length).trim() : fullText
      
      chapters.push({
        id: getChapterNumber(numberWord),
        title: title,
        content: content
      })
    }
    
    return chapters
  } catch (error) {
    console.error('Error parsing story file:', error)
    return []
  }
}

function getChapterNumber(word: string): number {
  const numbers: { [key: string]: number } = {
    'One': 1, 'Two': 2, 'Three': 3, 'Four': 4, 'Five': 5,
    'Six': 6, 'Seven': 7, 'Eight': 8, 'Nine': 9, 'Ten': 10
  }
  return numbers[word] || 1
}

export function getAllChapters(filePath: string): Chapter[] {
  return parseStoryFile(filePath)
}

export function getChapters5to10(filePath: string): Chapter[] {
  const allChapters = parseStoryFile(filePath)
  return allChapters.filter(chapter => chapter.id >= 5 && chapter.id <= 10)
}

// Export functions for use in other modules
export default {
  parseStoryFile,
  getAllChapters,
  getChapters5to10
}