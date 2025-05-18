# API Gateway Server

프로덕션 레벨의 MSA 아키텍처 API Gateway 서버입니다. 이 게이트웨이는 모든 API 요청의 진입점 역할을 하며, 인증, 인가, 로깅, 부하 분산, 장애 대응 등의 기능을 제공합니다.

## 기능

- **인증 및 인가**: JWT 토큰 기반의 인증 및 역할 기반 권한 부여
- **로깅**: 중앙 집중식 로깅 시스템
- **부하 분산**: 마이크로서비스 간의 트래픽 분산
- **장애 처리**: 장애 감지 및 대응 메커니즘
- **확장성**: 새로운 마이크로서비스 추가를 위한 유연한 설계
- **모니터링**: 시스템 상태 및 성능 모니터링
- **레이트 리미팅**: 과도한 요청으로부터 시스템 보호
- **도커 컨테이너화**: 쉬운 배포 및 확장

## 기술 스택

- **[NestJS](https://nestjs.com/)**: 기본 프레임워크
- **[Passport](http://www.passportjs.org/)**: 인증
- **[JWT](https://jwt.io/)**: 토큰 기반 인증
- **[Winston](https://github.com/winstonjs/winston)**: 로깅
- **[Docker](https://www.docker.com/)**: 컨테이너화
- **[NGINX](https://www.nginx.com/)**: 프록시 및 로드 밸런싱

## 시작하기

### 필수 조건

- Node.js 18 이상
- Docker 및 Docker Compose
- (선택사항) NGINX

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
│   ├── auth/            # 인증 관련 로직
│   ├── common/          # 공통 유틸, 가드, 데코레이터, 필터
│   ├── config/          # 환경 설정
│   ├── gateway/         # 프록시 및 라우팅 로직
│   ├── health/          # 헬스체크
│   ├── logging/         # 로깅 관련
│   └── middleware/      # 미들웨어
├── nginx/               # NGINX 설정
│   ├── conf.d/          # NGINX 서버 설정
│   └── nginx.conf       # 메인 NGINX 설정
├── Dockerfile           # Docker 빌드 설정
├── docker-compose.yml   # 개발용 Docker Compose 설정
└── docker-compose.prod.yml # 프로덕션용 Docker Compose 설정
```

## 배포

### 프로덕션 배포

1. 프로덕션용 환경 변수 파일을 생성합니다:

```bash
cp .env .env.prod
```

2. `.env.prod` 파일을 프로덕션 환경에 맞게 수정합니다.

3. 프로덕션 Docker Compose 파일을 사용하여 배포합니다:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 스케일링

프로덕션 환경에서 API Gateway를 스케일링하려면:

```bash
# 서비스 인스턴스 수 증가
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3
```

## 보안

- JWT 토큰을 사용한 안전한 인증
- HTTPS를 통한 암호화된 통신
- 역할 기반 접근 제어
- 레이트 리미팅으로 DDoS 방어
- 보안 헤더 적용
- 최신 TLS 프로토콜 사용

## 라이센스

[MIT Licensed](LICENSE)
