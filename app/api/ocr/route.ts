import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // AI 분석을 시뮬레이션하기 위해 2초간 대기합니다.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 고정된 테스트 데이터를 반환합니다.
    const mockResult = {
      name: 'Phosphate-Buffered Saline (PBS)',
      brand: 'Gibco',
      isStock: true,
      remaining: 100
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    return NextResponse.json({ error: '분석 실패' }, { status: 500 });
  }
}