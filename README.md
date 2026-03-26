# maumlog-backend

마음로그 프론트엔드와 연결되는 로컬 백엔드 서버입니다.  
회원가입, 로그인, 프로필 관리, 일기 저장/조회/수정, 감정 분석 응답을 로컬 개발 환경에서 빠르게 검증할 수 있도록 구성되어 있습니다.

## Overview

- Express 기반 경량 API 서버
- 프론트엔드가 기대하는 API 계약에 맞춘 엔드포인트 제공
- 별도 DB 없이 JSON 파일 기반 로컬 저장소 사용
- 감정 분석 응답을 위한 개발용 로직 포함

## Tech Stack

- Node.js
- Express
- CORS
- File-based JSON persistence

## Main Features

- 사용자
  - 회원가입
  - 로그인
  - 프로필 조회 / 수정
  - 비밀번호 변경
  - 계정 삭제
- 일기
  - 생성
  - 목록 조회
  - 상세 조회
  - 수정
- 분석
  - 감정 코드 추론
  - 감정 점수 / 공감 문장 / 키워드 / 노래 추천 응답 생성

## Project Structure

```bash
src/
  server.js      # Express entrypoint and API routes

data/
  db.json        # Local persisted data store
```

## Local Development

### 1. Install

```bash
npm install
```

### 2. Start the server

```bash
npm run dev
```

기본 주소는 `http://localhost:8080` 입니다.

헬스 체크:

```bash
GET /service1/health
```

## Environment Variables

```bash
PORT=8080
```

- `PORT`
  - 선택값
  - 기본값은 `8080`

## Data Storage

- 개발용 데이터는 `data/db.json`에 저장됩니다.
- 현재는 전통적인 DB(MySQL/PostgreSQL)가 아니라 로컬 파일 저장 구조입니다.
- 프론트엔드 기능 검증과 로컬 데모를 빠르게 진행하기 위한 형태입니다.

## Notes

- 이 서버는 `maumlog-frontend`와 함께 사용하는 것을 기준으로 설계되었습니다.
- 실제 서비스 배포 단계에서는 SQLite 또는 PostgreSQL 같은 정식 DB로 교체하는 것이 적합합니다.
- 분석 응답은 현재 개발용 규칙 기반 로직으로 생성됩니다.
