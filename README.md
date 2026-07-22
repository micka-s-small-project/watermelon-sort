# watermelon-sorter

독립 실행형 Android 앱으로 빌드할 수 있는 React + Phaser 게임입니다.

## 시작하기

```bash
npm run dev
```

## Android APK 만들기

Android Studio를 설치한 뒤 아래 명령으로 웹 게임을 Android 프로젝트에 반영하세요.

```bash
npm run android:sync
npm run android:open
```

Android Studio에서 `Build > Build APK(s)`를 선택하면 테스트용 APK가 생성됩니다.
스토어 배포용은 `Build > Generate Signed Bundle / APK > APK`에서 서명 키를 사용해 생성하세요.

APK는 보통 다음 위치에 생성됩니다.

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

앱 ID는 `com.watermelonsorter.game`이며, Play 스토어 출시 전에 실제 소유 도메인에 맞게 `capacitor.config.ts`에서 확정하세요.
