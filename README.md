# MSA Servers

이 저장소는 **NestJS** 기반의 마이크로서비스 세 개를 한곳에 모아 관리 하는 프로젝트입니다.  
각 서비스는 독립적으로 배포·확장 가능하며, **RabbitMQ**, **MongoDB**, **Redis** 등을 활용해 느슨하게 결합된 MSA 아키텍처를 구현합니다.

> 서비스별 세부 실행 방법·환경 변수 설정·API 문서는 각 폴더 내부의 `README.md`를 참고해 주세요.


## 로컬 환경 설정 방법
node.js lts 설치
루트 폴더에서 docker-compose.yml up 실행
각 마이크로서비스 폴더에서 npm i 실행
.env 값 설정
npm run start:dev 실행

---
## 설계 의도

#### 백엔드 패키지 특성 상 각각의 배포 구성 파이프라인을 만드는 것이 유리하다고 생각해서 모노레포의 단일 패키지 관리 방식은 사용하지 않았습니다.
#### 공통 패키지, 공통 라우터, 공통 Enum 등 프로젝트 전체에서 공유해야하는 데이터에 대해서는 private library 패키지나 데이터베이스, Json파일로 관리하는 것이 편리하지만 해당 프로젝트에서는 적용하지 않았습니다.
#### live probe, fail over, monitoring, logging 중앙 집중화 및 관리, load balancing, 서킷브레이커 같은 부분들은 별도로 적용하지 않았습니다.
#### 실제 환경에서는 k8s, datadog, AWS, ELK 같은 클라우드 및 컨테이너, 모니터링, 로깅 서비스들을 통해 해결하거나 직접 구축해야 합니다.
#### 기능적으로 동기가 유리한 부분은 HTTP를, 비동기 처리가 유리한 부분은 메세지 큐를 사용했습니다.
#### 로컬 개발환경에서는 도커를 이용해 db 및 인프라 구성만 컨테이너로 실행하고, 각 서비스의 .env와 로컬 node.js 런타임을 이용해 서비스를 실행합니다.
---

### 1. api-gateway

| 항목            | 내용 |
|-----------------|------|
| 역할            | 단일 엔드포인트로 모든 클라이언트 요청을 수신해 내부 서비스로 **프록시**<br>· Swagger 통합 문서, 공통 로깅/보안 헤더 적용<br>· 서비스 간 통신 시 고정 경로 ↔ 동적 환경 변수 매핑 지원 |
| 주요 기술        | NestJS (Express), Winston, Helmet, HTTP Proxy |
| 통신 방식        | 클라이언트 ⇔ Gateway : **REST / HTTP**<br>Gateway ⇔ 내부 서비스 : **REST** (동기) + **RabbitMQ** (비동기) |
| 특징            | • 경로 우선순위 기반 라우팅 테이블<br>• 역할/권한 정보를 헤더로 전달하여 각 서비스에서 추가 인증 부담을 줄임 |

### 2. auth-service

| 항목            | 내용 |
|-----------------|------|
| 역할            | • 회원 가입, 로그인, 토큰 재발급<br>• RBAC(Role-Based Access Control) 구현<br>• 다른 서비스 요청 시 **JWT** 발급 & 검증 |
| 주요 기술        | NestJS, MongoDB(Mongoose), Redis 캐시, Passport-JWT |
| 통신 방식        | • Gateway ↔ Auth : REST |
| 특징            | • Redis로 세션/리프레시 토큰 블랙리스트 관리<br>• 중앙 인증 서비스로서 확장성을 고려한 멀티-인스턴스 운영 가능 |

### 3. game-event-service

| 항목            | 내용 |
|-----------------|------|
| 역할            | • 게임 내 이벤트(출석, 초대 등) CRUD<br>• 조건 충족 여부 판단 및 보상 지급 요청<br>• 보상 이력 저장·조회 |
| 주요 기술        | NestJS, MongoDB, Redis(중복 보상 방지), RabbitMQ |
| 통신 방식        | • Gateway ↔ Event : REST (관리용, 조회용)<br>• **RabbitMQ** : 이벤트 요청/결과 비동기 교환 |
| 특징            | • `prefetchCount` 조절로 소비량 튜닝<br>• 인-메모리 캐시 + MongoDB 이중화로 성능·내구성 확보 |

---

