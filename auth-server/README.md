# Auth Server

MSA 아키텍처 Auth Server 입니다. 

- 인증, 권한관리, 역할관리, 사용자 정보 등록, 로그인, 로그아웃등을 전담하는 서버
- 일반 유저 외에 다른 역할의 사용자는 직접 데이터를 DB에 입력해야 합니다.(관리자 등록 등의 백오피스 기능 구현하지 않음) 

## 기능

- **인증 및 인가**: JWT 토큰 기반의 인증 및 역할 관리
- **회원관리**: 사용자 관련 데이터 관리 및 로그인관리
- **토큰관리**: 토큰 발급, 재발급, 검증, 저장
- **도커 컨테이너화**: 쉬운 배포 및 확장

## 기술 스택

- **[NestJS](https://nestjs.com/)**: 기본 프레임워크
- **[Passport](http://www.passportjs.org/)**: 인증
- **[JWT](https://jwt.io/)**: 토큰 기반 인증
- **[Winston](https://github.com/winstonjs/winston)**: 로깅
- **[Docker](https://www.docker.com/)**: 컨테이너화

## 시작하기

### 필수 조건

- Node.js 18 이상
- Docker 및 Docker Compose

### 환경 설정

1. 환경 변수 파일을 설정합니다:

```bash
cp .env.example .env
```

2. 필요에 따라 `.env` 파일을 수정합니다.

### 개발 모드로 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev
```

### Docker로 실행

```bash
# 개발 모드
docker-compose up

# 프로덕션 모드
docker-compose -f docker-compose.prod.yml up -d
```

## 프로젝트 구조

```
api-gateway-server/
├── src/
│   ├── auth/            # 인증 관련 모듈
│   ├── cache/          # 캐시 모듈
│   ├── common/          # 공통 미들웨어, 인터셉터, 필터 등
│   ├── health/         # 헬스체크
│   ├── roles/          # 역할 관리 모듈
│   ├── token/         # 로깅 관련
│   └── users/      # 사용자 관레 모듈
├── Dockerfile           # Docker 빌드 설정
├── docker-compose.yml   # 개발용 Docker Compose 설정
```
