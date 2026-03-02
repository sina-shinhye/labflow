'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState({ title: '', content: '' })
  const [isAnalyzed, setIsAnalyzed] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `notebooks/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      
      // AI 분석 시뮬레이션
      setTimeout(() => {
        setNoteContent({
          title: "WB — β-actin 검증 (Exp #WB-042)",
          content: "Sample: HeLa WT vs KO\nResult: Band at ~42 kDa 확인 완료."
        })
        setIsAnalyzed(true)
        setUploading(false)
      }, 2000)

    } catch (error: any) {
      alert(error.message)
      setUploading(false)
    }
  }

  const saveNotebook = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('lab_notebooks').insert([{
      title: noteContent.title,
      content: noteContent.content,
      image_url: imageUrl,
      from_ocr: true,
      created_by: user?.id
    }])

    if (!error) alert('실험 노트가 성공적으로 저장되었습니다!')
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">📷 실험 데이터 업로드 및 분석</h2>
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center bg-white">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        <p className="mt-2 text-slate-500">{uploading ? 'AI 분석 중...' : '노트 사진을 올려주세요.'}</p>
      </div>

      {isAnalyzed && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <input className="w-full text-xl font-bold border-b pb-2 outline-none" value={noteContent.title} onChange={e => setNoteContent({...noteContent, title: e.target.value})} />
          <textarea className="w-full h-40 p-4 bg-slate-50 rounded-xl font-mono text-sm leading-relaxed outline-none" value={noteContent.content} onChange={e => setNoteContent({...noteContent, content: e.target.value})} />
          <button onClick={saveNotebook} className="w-full py-3 bg-[#C41E3A] text-white rounded-xl font-bold">💾 전자 실험 노트로 저장</button>
        </div>
      )}
    </div>
  )
}