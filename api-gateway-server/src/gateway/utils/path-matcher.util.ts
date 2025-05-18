export function pathToRegex(path: string): RegExp {
  // :param 형식의 경로 파라미터를 정규식으로 변환
  // 예: 'auth/users/:id/roles' -> /^auth\/users\/([^\/]+)\/roles$/
  const regexPattern = path
    .replace(/\//g, '\\/') // 슬래시를 이스케이프
    .replace(/:([^\/]+)/g, '([^\\/]+)'); // :param을 캡처 그룹으로 변환

  return new RegExp(`^${regexPattern}$`);
}

// 경로 매칭 및 파라미터 추출 함수
export function matchPath(pattern: string, path: string): { params: Record<string, string> } | null {
  // 파라미터 이름 추출
  const paramNames = pattern.match(/:([^\/]+)/g)?.map(p => p.substring(1)) || [];

  // 패턴을 정규식으로 변환
  const regex = pathToRegex(pattern);

  // 경로 매칭 시도
  const match = path.match(regex);

  // 매칭 실패시 null 반환
  if (!match) {
    return null;
  }

  // 파라미터 값 추출 (첫 번째 요소는 전체 매치이므로 제외)
  const paramValues = match.slice(1);

  // 파라미터 객체 생성
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = paramValues[index];
  });

  return { params };
}
