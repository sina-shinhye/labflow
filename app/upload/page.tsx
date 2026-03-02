'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `notebooks/${fileName}`

      // 1. Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. 업로드된 파일의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      alert('이미지가 성공적으로 업로드되었습니다!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">📷 실험 데이터 업로드</h2>
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center bg-white">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="mb-4" />
        <p className="text-slate-500 text-sm">{uploading ? '업로드 중...' : '실험 결과 사진이나 노트를 업로드하세요.'}</p>
      </div>

      {imageUrl && (
        <div className="mt-8">
          <p className="font-bold mb-2">업로드 결과:</p>
          <img src={imageUrl} alt="Uploaded" className="max-w-md rounded-lg shadow-lg border" />
        </div>
      )}
    </div>
  )
}