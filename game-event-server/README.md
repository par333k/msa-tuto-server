# 게임 이벤트 처리 서버

NestJS와 RabbitMQ를 이용한 마이크로서비스 기반의 게임 이벤트 처리 시스템입니다. 본 서버는 게임 내 이벤트 관리, 조건 충족 검증, 보상 지급 요청 처리 등을 담당합니다.

## 주요 기능

### 역할 기반 접근 제어
- **USER**: 보상 요청 가능
- **OPERATOR**: 이벤트/보상 등록
- **AUDITOR**: 보상 이력 조회만 가능
- **ADMIN**: 모든 기능 접근 가능

### 이벤트 관리
- 이벤트 등록/조회/수정/삭제
- 이벤트 타입 지원:
  - 로그인 이벤트 (일정 일수 연속 로그인)
  - 친구 초대 이벤트 (일정 수 이상 초대)
- 이벤트 상태 관리 (활성/비활성)
- 이벤트 기간 설정

### 보상 관리
- 보상 등록/조회/수정/삭제
- 보상 타입 지원:
  - 쿠폰
  - 아이템
- 보상 수량 설정
- 이벤트별 보상 연결

### 보상 요청 처리
- 사용자 보상 요청 처리
- 조건 충족 여부 자동 검증
- 중복 보상 요청 방지 (Redis 활용)
- 요청 상태 추적 (대기/승인/거부/실패)

### 보상 요청 이력 관리
- 사용자별 보상 요청 이력 조회
- 관리자/감사자용 전체 요청 이력 조회
- 필터링 기능 (이벤트별, 상태별, 기간별)

## 기술 스택

- **프레임워크**: NestJS
- **메시지 큐**: RabbitMQ
- **데이터베이스**: MongoDB
- **캐싱**: Redis
- **컨테이너화**: Docker, Docker Compose
- **테스트**: Jest

## 설치 및 실행 방법

### 사전 요구사항

- Node.js v16 이상
- npm 또는 yarn
- MongoDB
- Redis
- RabbitMQ

### 로컬 개발 환경 설정

1. 저장소 복제
```bash
git clone <repository-url>
cd game-event-server
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 변경
```

4. 개발 서버 실행
```bash
npm run start:dev
```

### Docker를 이용한 실행

1. Docker Compose로 전체 환경 구성 및 실행
```bash
docker-compose up -d
```

2. 서비스 상태 확인
```bash
docker-compose ps
```

3. 서비스 중지
```bash
docker-compose down
```

## 테스트 실행

```bash
# 전체 테스트 실행
npm test

# 테스트 커버리지 보고서
npm run test:cov

# E2E 테스트 실행
npm run test:e2e
```

## 메시지 패턴

이 마이크로서비스는 다음과 같은 RabbitMQ 메시지 패턴으로 통신합니다:

### 이벤트 관리
- `create_event`: 이벤트 생성
- `find_all_events`: 모든 이벤트 조회
- `find_event_by_id`: 특정 이벤트 조회
- `find_active_events`: 활성 이벤트 조회
- `update_event`: 이벤트 업데이트
- `remove_event`: 이벤트 삭제

### 보상 관리
- `create_reward`: 보상 생성
- `find_all_rewards`: 모든 보상 조회
- `find_reward_by_id`: 특정 보상 조회
- `find_rewards_by_event_id`: 이벤트별 보상 조회
- `update_reward`: 보상 업데이트
- `remove_reward`: 보상 삭제

### 보상 요청
- `create_reward_request`: 보상 요청 생성
- `find_all_reward_requests`: 모든 보상 요청 조회
- `find_reward_request_by_id`: 특정 보상 요청 조회
- `find_user_reward_requests`: 사용자별 보상 요청 조회
- `update_reward_request`: 보상 요청 상태 업데이트

## 확장성

본 프로젝트는 모듈화된 구조로 설계되어 있어 다음과 같은 확장이 용이합니다:

1. **새로운 이벤트 타입 추가**: `EventType` 열거형과 해당 조건 검증 로직 추가
2. **새로운 보상 타입 추가**: `RewardType` 열거형과, 보상 지급 로직 추가
3. **API Gateway 연동**: 기존 메시지 패턴 활용 또는 확장

## 기여 방법

1. 본 저장소를 Fork합니다.
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치를 Push합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.
