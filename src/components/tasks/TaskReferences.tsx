'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from './ImageUpload'
import { LinksList } from './LinksList'
import { VideoReferenceAdd } from './VideoReferenceAdd'
import { ConceptNoteEditor } from './ConceptNoteEditor'
import { Image, Link2, Video, FileText } from 'lucide-react'
import type { TaskReference } from '@/lib/types/app.types'

interface TaskReferencesProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
  canEdit: boolean
}

export function TaskReferences({ taskId, references, isAdmin, canEdit }: TaskReferencesProps) {
  const images = references.filter(r => r.type === 'image')
  const links = references.filter(r => r.type === 'link')
  const videos = references.filter(r => r.type === 'video')
  const notes = references.filter(r => r.type === 'note')

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-9">
        <TabsTrigger value="images" className="text-xs gap-1.5">
          <Image className="w-3.5 h-3.5" />
          Images {images.length > 0 && <span className="text-[10px] opacity-60">({images.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="links" className="text-xs gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Links {links.length > 0 && <span className="text-[10px] opacity-60">({links.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="videos" className="text-xs gap-1.5">
          <Video className="w-3.5 h-3.5" />
          Video {videos.length > 0 && <span className="text-[10px] opacity-60">({videos.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="notes" className="text-xs gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Notes {notes.length > 0 && <span className="text-[10px] opacity-60">({notes.length})</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="images" className="mt-4">
        <ImageUpload taskId={taskId} references={images} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="links" className="mt-4">
        <LinksList taskId={taskId} references={links} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="videos" className="mt-4">
        <VideoReferenceAdd taskId={taskId} references={videos} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <ConceptNoteEditor
          taskId={taskId}
          references={notes}
          isAdmin={isAdmin}
          canEdit={canEdit}
        />
      </TabsContent>
    </Tabs>
  )
}
