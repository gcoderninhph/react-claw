# React Role (Bản tiếng Việt)

Sử dụng role này khi triển khai hoặc cập nhật dự án React, đặc biệt với mục tiêu kiến trúc UI rõ ràng, chia nhỏ component để tái sử dụng cao.

## 1) Mục tiêu
- Xây dựng giao diện theo hướng component hóa mạnh.
- Chia component thật nhỏ để tái sử dụng cho nhiều màn hình.
- Tách rõ phần hiển thị (UI), logic nghiệp vụ, và dữ liệu.
- Giảm lặp code form bằng cách chuẩn hóa bộ component dùng chung.

## 2) Nguyên tắc bắt buộc
- Ưu tiên tạo component nhỏ, đơn nhiệm, dễ test.
- Không nhét quá nhiều logic vào một component màn hình.
- Mỗi component dùng chung phải có API props rõ ràng.
- Dùng composition thay vì copy-paste JSX.
- Chuẩn hóa event handlers (`onChange`, `onBlur`, `onSubmit`).
- Với form, luôn có cơ chế hiển thị lỗi, trạng thái loading, trạng thái disabled.

## 3) Quy ước chia component cho form
Bắt buộc tách tối thiểu theo các nhóm sau:
- `Button`
- `Input`
- `Select`
- `TextArea`
- `Checkbox` / `Radio`
- `FormField` (label + input + helper/error)
- `FormSection` (gom nhóm trường)
- `DataTable`

Ví dụ cấu trúc:

```txt
src/
  components/
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      TextArea.tsx
      FormField.tsx
      DataTable.tsx
    forms/
      UserForm.tsx
      ProductForm.tsx
```

## 4) Quy tắc API cho component tái sử dụng
- Props phải rõ nghĩa, tránh tên mơ hồ.
- Hạn chế props “đa năng” gây khó đọc.
- Tạo type/interface cho props (TypeScript) hoặc PropTypes (JavaScript).
- Cho phép truyền className để mở rộng style.
- Hỗ trợ `ref` khi cần tích hợp form library.

Ví dụ API tốt:

```ts
type InputProps = {
  label?: string;
  name: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};
```

## 5) Input có thể truyền vào component khác (composition)
Đây là yêu cầu bắt buộc trong role này: `input` phải có thể được truyền như một component con để tái sử dụng linh hoạt.

### Ví dụ 1: Truyền Input vào FormField qua `children`

```tsx
// FormField.tsx
import React from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label>
        {label} {required ? <span>*</span> : null}
      </label>
      <div>{children}</div>
      {error ? <small className="error">{error}</small> : null}
    </div>
  );
}
```

```tsx
// UserForm.tsx
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";

<FormField label="Email" error={errors.email} required>
  <Input
    name="email"
    value={form.email}
    placeholder="Nhập email"
    onChange={handleChange}
  />
</FormField>
```

### Ví dụ 2: Truyền component Input qua prop `inputComponent`

```tsx
type FieldShellProps = {
  label: string;
  error?: string;
  inputComponent: React.ReactNode;
};

export function FieldShell({ label, error, inputComponent }: FieldShellProps) {
  return (
    <div>
      <label>{label}</label>
      {inputComponent}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
    </div>
  );
}
```

```tsx
<FieldShell
  label="Số điện thoại"
  error={errors.phone}
  inputComponent={
    <Input
      name="phone"
      value={form.phone}
      onChange={handleChange}
      placeholder="Nhập số điện thoại"
    />
  }
/>
```

### Ví dụ 3: Truyền Input đã bọc logic vào component cha

```tsx
function ControlledEmailInput(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      name="email"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder="abc@company.com"
    />
  );
}

function ProfileForm() {
  const [email, setEmail] = React.useState("");

  return (
    <FormField label="Email">
      <ControlledEmailInput value={email} onChange={setEmail} />
    </FormField>
  );
}
```

## 6) Quy tắc cho Button, Table, Select
### Button
- Có các biến thể rõ: `primary`, `secondary`, `danger`, `ghost`.
- Có trạng thái `loading`, `disabled`.
- Không hard-code text trong component dùng chung.

### DataTable
- Nhận `columns` và `rows` qua props.
- Hỗ trợ empty state, loading state.
- Tách cell renderer bằng callback khi cần.

### Select
- Dữ liệu options truyền qua props.
- Hỗ trợ placeholder, disabled, error.
- Hỗ trợ callback `onChange` thống nhất với form state.

## 7) Quy tắc tách logic
- Logic gọi API đặt ở hooks/services, không đặt dày đặc trong UI component.
- Component UI thuần nên không biết endpoint cụ thể.
- Form phức tạp: dùng custom hook (`useUserForm`, `useProductForm`) để gom validation + submit.

## 8) Quy tắc chất lượng code
- Tên component và props phải rõ nghĩa nghiệp vụ.
- Một file component không nên quá dài; nếu phình to thì tách nhỏ.
- Tránh truyền quá sâu (prop drilling) nếu state dùng toàn cục; cân nhắc context/store.
- Viết test cho component dùng chung quan trọng (ít nhất: render, change, error state).

## 9) Quy tắc ghi logs
- Không dùng `console.log` rải rác trong code production, đặc biệt trong component render.
- Ưu tiên dùng một logger thống nhất như `logger.debug`, `logger.info`, `logger.warn`, `logger.error`.
- Component UI thuần (`Button`, `Input`, `Select`, `Table`) không nên tự ý ghi log nghiệp vụ.
- Chỉ ghi log ở các điểm có ý nghĩa chẩn đoán hoặc theo dõi luồng nghiệp vụ như:
  - submit form
  - gọi API
  - lỗi validate phức tạp
  - chuyển trạng thái quan trọng
  - bắt lỗi bất đồng bộ
- Log phải có ngữ cảnh rõ ràng: tên tính năng, hành động, component hoặc hook liên quan.
- Không ghi log dữ liệu nhạy cảm như:
  - mật khẩu
  - token
  - cookie
  - access key
  - thông tin cá nhân đầy đủ nếu không thực sự cần thiết
- Nếu cần log dữ liệu người dùng, chỉ log định danh tối thiểu hoặc dữ liệu đã làm mờ.
- Tách `message` và `metadata` rõ ràng, tránh ghép chuỗi dài khó parse.
- `debug` chỉ nên bật ở môi trường phát triển hoặc qua cờ cấu hình.
- `error` phải đi kèm thông tin đủ để truy vết: action, params an toàn, response code, request id nếu có.
- Không log lặp vô nghĩa trong mỗi lần render hoặc trong effect chạy liên tục.

Ví dụ logger nên dùng:

```ts
logger.info("user_form_submit_started", {
  feature: "user_management",
  action: "create_user",
  source: "UserForm"
});

logger.error("user_form_submit_failed", {
  feature: "user_management",
  action: "create_user",
  source: "useUserForm",
  statusCode: error.response?.status,
  message: error.message
});
```

Ví dụ không nên dùng:

```ts
console.log("submit user", formData);
console.log("token", accessToken);
console.log("render UserForm");
```

Ví dụ áp dụng đúng trong React:

```tsx
async function handleSubmit() {
  logger.info("profile_form_submit_started", {
    feature: "profile",
    action: "update_profile",
    source: "ProfileForm"
  });

  try {
    await updateProfile(form);
    logger.info("profile_form_submit_succeeded", {
      feature: "profile",
      action: "update_profile",
      source: "ProfileForm"
    });
  } catch (error) {
    logger.error("profile_form_submit_failed", {
      feature: "profile",
      action: "update_profile",
      source: "ProfileForm",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
```

Quy ước vị trí đặt logger trong source code:
- Logger dùng chung của React phải đặt tại một trong hai vị trí sau:
  - `src/shared/logger.ts`
  - `src/lib/logger.ts`
- Nếu dự án đa nền tảng, tách adapter logger theo target ở các file rõ ràng:
  - `src/shared/loggers/webLogger.ts`
  - `src/shared/loggers/desktopRendererLogger.ts`
  - `src/shared/loggers/androidLogger.ts`
- Nếu có desktop runtime như Electron, logger cho main process phải tách riêng, ví dụ:
  - `electron/logger/mainLogger.ts`
  - hoặc `desktop/logger/mainLogger.ts`
- `hooks/` hoặc `services/` là nơi ưu tiên đặt log nghiệp vụ.
- UI component chỉ log khi thật sự cần cho hành vi UI phức tạp, ví dụ upload nhiều bước hoặc bảng có state tương tác đặc biệt.

Quy ước thư mục lưu log khi cần ghi file cục bộ:

```txt
logs/
  web/
    build.log
    runtime-forwarded.log
  desktop/
    build.log
    renderer.log
    main.log
  android/
    gradle-build.log
    metro.log
    logcat.log
```

Lưu ý bắt buộc:
- Trình duyệt web không thể tự ghi trực tiếp vào file trong thư mục repo chỉ bằng JavaScript chạy trên browser.
- Vì vậy, với web runtime, log mặc định được đọc ở DevTools Console.
- Chỉ khi dự án có cơ chế forward log về backend hoặc shell native thì mới ghi được vào file như `logs/web/runtime-forwarded.log`.

### Ghi log theo từng loại target

#### Trường hợp 1: React build web
Mục tiêu log:
- Theo dõi lỗi build frontend.
- Theo dõi lỗi runtime phía trình duyệt.
- Theo dõi API request/response và hành vi người dùng quan trọng.

Cách ghi log:
- Build-time log:
  - Log sinh ra từ lệnh build như `npm run build`, `vite build`, `webpack build`.
  - Nếu cần lưu file log cục bộ, chuẩn hóa ghi vào: `logs/web/build.log`.
  - Ví dụ PowerShell:

```powershell
npm run build *> logs/web/build.log
```
- Runtime log:
  - Dùng `logger.info`, `logger.warn`, `logger.error` trong `hooks`, `services`, `pages`, hoặc `containers`.
  - Không log tràn lan trong các component UI nhỏ.
  - Log các sự kiện như submit form, call API, route change quan trọng, lỗi xử lý dữ liệu.
  - File logger source nên đặt tại:
    - `src/shared/logger.ts`
    - hoặc `src/shared/loggers/webLogger.ts`

Đọc log ở đâu:
- Log build:
  - Nếu không redirect file: đọc trực tiếp ở terminal chạy build hoặc CI logs.
  - Nếu đã redirect: đọc tại `logs/web/build.log`.
  - Ví dụ PowerShell:

```powershell
Get-Content .\logs\web\build.log -Tail 200
```
- Log runtime web:
  - Mặc định: Browser DevTools > Console.
  - Request API: Browser DevTools > Network.
  - Nếu có forward log về backend: đọc tại `logs/web/runtime-forwarded.log` ở server nhận log.
  - Nếu có remote logging: đọc trên dashboard như Sentry, Datadog, Grafana, Elastic.

Kết luận rõ cho web:
- Build log local: `logs/web/build.log`
- Runtime log local mặc định: không có file trong repo, đọc ở DevTools Console
- Runtime log có lưu file chỉ khi có backend/native bridge: `logs/web/runtime-forwarded.log`

Ví dụ:

```ts
logger.info("web_user_search_started", {
  platform: "web",
  feature: "user_search",
  action: "search",
  source: "UserSearchPage"
});
```

#### Trường hợp 2: React build desktop
Áp dụng cho các dự án React chạy trong desktop shell như Electron hoặc nền tảng tương tự.

Mục tiêu log:
- Tách rõ log của giao diện React và log của tiến trình desktop runtime.
- Theo dõi lỗi renderer, preload, IPC, file system, native integration.

Cách ghi log:
- Build-time log:
  - Log build của desktop app phải lưu vào `logs/desktop/build.log` nếu cần lưu cục bộ.
  - Ví dụ PowerShell:

```powershell
npm run dist *> logs/desktop/build.log
```
- Runtime log:
  - Renderer process: dùng logger chung của React như web.
  - Main process / native shell: phải có logger riêng cho desktop runtime.
  - Nếu dùng Electron, nên có logger riêng cho main process, ví dụ `electron-log` hoặc một wrapper tương đương.
  - File logger source nên tách rõ:
    - Renderer: `src/shared/loggers/desktopRendererLogger.ts`
    - Main: `electron/logger/mainLogger.ts`
  - Log các sự kiện như:
    - khởi động app
    - tạo window
    - lỗi IPC
    - đọc/ghi file
    - lỗi đồng bộ dữ liệu cục bộ

Đọc log ở đâu:
- Log build:
  - Nếu không redirect file: terminal chạy build hoặc CI/CD logs.
  - Nếu đã redirect: `logs/desktop/build.log`.
- Log renderer:
  - DevTools của cửa sổ desktop nếu app cho phép mở.
  - Nếu renderer được cấu hình ghi file local: `logs/desktop/renderer.log`.
- Log main process:
  - Dev local: terminal chạy Electron main process.
  - File log local khi chạy theo quy ước repo: `logs/desktop/main.log`.
  - File log packaged app trên Windows nếu dùng Electron thường nằm ở:
    - `%APPDATA%/<AppName>/logs/main.log`
    - hoặc `%USERPROFILE%/AppData/Roaming/<AppName>/logs/main.log`

Ví dụ đọc log desktop bằng PowerShell:

```powershell
Get-Content .\logs\desktop\renderer.log -Tail 200
Get-Content .\logs\desktop\main.log -Tail 200
```

Kết luận rõ cho desktop:
- Build log local: `logs/desktop/build.log`
- Renderer runtime log local: `logs/desktop/renderer.log`
- Main runtime log local: `logs/desktop/main.log`
- Bản cài packaged trên Windows: `%APPDATA%/<AppName>/logs/main.log`

Ví dụ quy ước log desktop:

```ts
logger.info("desktop_sync_started", {
  platform: "desktop",
  feature: "local_sync",
  action: "start_sync",
  source: "SyncService"
});
```

Ghi chú bắt buộc:
- Không trộn log renderer và log main process vào cùng một nơi mà không có trường phân biệt.
- Luôn có trường `platform: "desktop"` và thêm `process: "renderer" | "main"` khi cần.

#### Trường hợp 3: React build Android
Áp dụng cho một trong các trường hợp sau:
- React Native.
- React chạy trong Android wrapper như Capacitor/Cordova/WebView.

Mục tiêu log:
- Theo dõi lỗi build Android.
- Theo dõi lỗi JavaScript runtime.
- Theo dõi lỗi native bridge, permissions, network, storage.

Cách ghi log:
- Build-time log:
  - Đọc từ terminal của Gradle, Metro, hoặc Android build command.
  - Ví dụ: `./gradlew assembleRelease`, `npx react-native run-android`, `npm run android`.
  - Nếu cần lưu file log cục bộ, chuẩn hóa như sau:
    - Build Gradle: `logs/android/gradle-build.log`
    - Metro: `logs/android/metro.log`
    - Logcat export: `logs/android/logcat.log`
  - Ví dụ PowerShell:

```powershell
cd android
.\gradlew assembleRelease *> ..\logs\android\gradle-build.log
```

```powershell
npx react-native start *> logs/android/metro.log
```
- Runtime log:
  - JavaScript layer: dùng `logger.info`, `logger.warn`, `logger.error` như trong React app.
  - Native layer / Android shell: log ở Logcat hoặc logger native nếu có.
  - Với React Native, ưu tiên log ở hooks/services cho logic JS; lỗi native đọc qua Logcat.
  - Với Capacitor/WebView, log UI có thể xem từ WebView DevTools hoặc Android log tùy cấu hình.
  - File logger source nên đặt tại:
    - `src/shared/loggers/androidLogger.ts`

Đọc log ở đâu:
- Log build:
  - Terminal local.
  - Android Studio Build Output.
  - CI logs nếu build qua pipeline.
  - Nếu đã redirect file: `logs/android/gradle-build.log`.
- Log runtime JS:
  - Metro console.
  - Nếu đã redirect: `logs/android/metro.log`.
  - React Native debugger hoặc công cụ tương đương.
  - Remote logging dashboard nếu có tích hợp.
- Log runtime native Android:
  - Android Studio Logcat.
  - `adb logcat` trên terminal.
  - Nếu export ra file: `logs/android/logcat.log`.

Ví dụ export Logcat ra file:

```powershell
adb logcat > logs/android/logcat.log
```

Ví dụ đọc file log Android bằng PowerShell:

```powershell
Get-Content .\logs\android\gradle-build.log -Tail 200
Get-Content .\logs\android\metro.log -Tail 200
Get-Content .\logs\android\logcat.log -Tail 200
```

Kết luận rõ cho Android:
- Build Gradle log local: `logs/android/gradle-build.log`
- Metro JS log local: `logs/android/metro.log`
- Native Android log export: `logs/android/logcat.log`

Ví dụ quy ước log Android:

```ts
logger.error("android_permission_request_failed", {
  platform: "android",
  feature: "media_upload",
  action: "request_storage_permission",
  source: "useMediaPermission",
  message: error instanceof Error ? error.message : "Unknown error"
});
```

Ghi chú bắt buộc:
- Nếu lỗi liên quan đến crash native, ANR, bridge hoặc permission, không chỉ đọc log JS; phải kiểm tra Logcat.
- Nếu build Android thành công nhưng app lỗi khi chạy, cần tách bạch lỗi JS và lỗi native trước khi sửa.

### Quy tắc format log dùng chung cho mọi target
- Nên có tối thiểu các trường sau trong metadata:
  - `platform`: `web` | `desktop` | `android`
  - `feature`: tên tính năng
  - `action`: hành động đang thực hiện
  - `source`: component, hook, service, hoặc module tạo log
- Nếu có request gọi backend, ưu tiên thêm:
  - `requestId`
  - `statusCode`
  - `endpoint`
- Nếu có desktop runtime, ưu tiên thêm:
  - `process`: `renderer` | `main`

Ví dụ log chuẩn đa nền tảng:

```ts
logger.info("profile_update_started", {
  platform: "web",
  feature: "profile",
  action: "update_profile",
  source: "useProfileForm"
});
```

### Quy tắc đọc log khi debug theo loại lỗi
- Lỗi build:
  - Xem terminal hoặc CI logs.
  - Nếu có redirect local thì đọc đúng file trong `logs/web/`, `logs/desktop/`, hoặc `logs/android/`.
- Lỗi giao diện web:
  - Xem DevTools Console và Network.
  - Nếu web có forward log về server thì kiểm tra thêm `logs/web/runtime-forwarded.log`.
- Lỗi giao diện desktop:
  - Xem `logs/desktop/renderer.log` trước.
  - Sau đó xem `logs/desktop/main.log` nếu có IPC, file system, preload, native integration.
- Lỗi Android:
  - Xem `logs/android/metro.log` hoặc Metro console trước.
  - Nếu nghi lỗi native, permission, crash, bridge: xem ngay Android Studio Logcat hoặc `logs/android/logcat.log`.
- Lỗi API:
  - Xem log ở service/hook phía client.
  - Đối chiếu với Network tab, backend logs, request id nếu có.

### Trường hợp fix bắt buộc phải đọc log để bổ sung context
Không được sửa theo cảm tính khi thuộc một trong các trường hợp sau. Trước khi sửa phải đọc log tương ứng để lấy đủ context.

#### 1) Fix lỗi build thất bại
- Bắt buộc đọc log build trước khi sửa.
- Đọc ở đâu:
  - Web: `logs/web/build.log` hoặc terminal build.
  - Desktop: `logs/desktop/build.log` hoặc terminal build.
  - Android: `logs/android/gradle-build.log` hoặc Android Studio Build Output.
- Mục tiêu cần lấy từ log:
  - file lỗi
  - dòng lỗi
  - plugin/tool gây lỗi
  - stack trace hoặc error code

#### 2) Fix lỗi trắng trang, render sai, component không lên
- Bắt buộc đọc runtime log trước.
- Đọc ở đâu:
  - Web: Browser DevTools > Console.
  - Desktop renderer: `logs/desktop/renderer.log` hoặc DevTools renderer.
  - Android JS: `logs/android/metro.log` hoặc Metro console.
- Mục tiêu cần lấy từ log:
  - component/source gây lỗi
  - props/state liên quan
  - error boundary message
  - stack trace React

#### 3) Fix lỗi API không trả dữ liệu hoặc trả sai
- Bắt buộc đọc cả log client và Network trước khi sửa.
- Đọc ở đâu:
  - Client web: DevTools > Network và Console.
  - Desktop: `logs/desktop/renderer.log`.
  - Android: `logs/android/metro.log`.
- Nếu có request forwarding hoặc backend log, đối chiếu thêm với:
  - `logs/web/runtime-forwarded.log`
  - backend logs tương ứng
- Mục tiêu cần lấy từ log:
  - endpoint
  - status code
  - request payload an toàn
  - response payload an toàn
  - request id nếu có

#### 4) Fix lỗi desktop liên quan IPC, preload, file system, native shell
- Bắt buộc đọc log main process trước khi sửa.
- Đọc ở đâu:
  - `logs/desktop/main.log`
  - hoặc terminal chạy Electron main process
  - hoặc `%APPDATA%/<AppName>/logs/main.log` với bản packaged trên Windows
- Mục tiêu cần lấy từ log:
  - IPC channel lỗi
  - preload bridge lỗi
  - path file lỗi
  - permission lỗi
  - exception ở main process

#### 5) Fix lỗi Android liên quan crash, ANR, permission, bridge native
- Bắt buộc đọc Logcat trước khi sửa.
- Đọc ở đâu:
  - Android Studio Logcat
  - `logs/android/logcat.log`
  - hoặc `adb logcat`
- Mục tiêu cần lấy từ log:
  - native exception
  - permission denial
  - bridge/module name lỗi
  - activity/service crash

#### 6) Fix lỗi chỉ xuất hiện sau build release
- Không chỉ đọc log dev.
- Bắt buộc đọc log của đúng môi trường release hoặc build release.
- Đọc ở đâu:
  - Web release: CI/CD logs, Sentry hoặc dashboard production.
  - Desktop release: `%APPDATA%/<AppName>/logs/main.log` hoặc log packaged app.
  - Android release: crash report system, Logcat khi chạy bản release test, hoặc dashboard crash nếu có.
- Mục tiêu cần lấy từ log:
  - lỗi chỉ xuất hiện khi minify/tree-shaking/obfuscation/build optimization bật
  - thông tin môi trường release

#### 7) Fix lỗi đồng bộ dữ liệu, race condition, double submit, state nhảy sai
- Bắt buộc đọc log theo timeline trước khi sửa.
- Đọc ở đâu:
  - Web: DevTools Console với log có timestamp.
  - Desktop: `logs/desktop/renderer.log` và `logs/desktop/main.log` nếu có IPC.
  - Android: `logs/android/metro.log`.
- Mục tiêu cần lấy từ log:
  - thứ tự event
  - thời điểm request bắt đầu/kết thúc
  - state transition quan trọng
  - action bị gọi lặp

### Log chỉ hiện ở dev mode, không được log ở release
Các log dưới đây chỉ được phép xuất hiện ở môi trường phát triển và không được ghi ở release build:
- `logger.debug(...)`
- log trace chi tiết từng bước UI
- log render component
- log props/state tạm để debug
- log dữ liệu form khi đang gõ
- log response payload chi tiết chỉ để soi lỗi trong lúc dev
- log dùng cho kiểm tra flow tạm thời khi fix bug

Các log sau có thể được giữ ở release nếu thật sự cần vận hành:
- `logger.warn(...)` cho cảnh báo nghiệp vụ quan trọng
- `logger.error(...)` cho lỗi runtime cần truy vết
- `logger.info(...)` chỉ khi là audit/event quan trọng và đã được phê duyệt

Quy tắc bật/tắt log theo môi trường:
- Phải có cờ môi trường rõ ràng để chặn log dev.
- Khuyến nghị dùng một trong các biến sau:
  - `import.meta.env.DEV`
  - `process.env.NODE_ENV === "development"`
  - `import.meta.env.VITE_ENABLE_DEBUG_LOGS === "true"`
- Release build phải mặc định:
  - không in `debug`
  - không in log render
  - không in log form data tạm

Ví dụ helper bắt buộc nên có:

```ts
export const isDevMode =
  (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
  process.env.NODE_ENV === "development";

export function debugLog(message: string, metadata?: Record<string, unknown>) {
  if (!isDevMode) {
    return;
  }

  logger.debug(message, metadata);
}
```

Ví dụ dùng đúng:

```ts
debugLog("user_form_state_changed", {
  platform: "web",
  feature: "user_form",
  source: "useUserForm",
  field: "email"
});
```

Ví dụ không được phép trong release:

```ts
logger.debug("render UserForm", { form });
logger.info("debug response", { response });
console.log("state", state);
```

Checklist bắt buộc trước khi merge release:
- Tìm và loại bỏ toàn bộ `console.log`, `console.debug`, `console.table` dùng để debug tạm.
- Đảm bảo `logger.debug` bị chặn bởi dev mode.
- Đảm bảo log render component không tồn tại trong nhánh release.
- Đảm bảo không có log chứa form data, token, cookie, hoặc payload nhạy cảm.
- Đảm bảo log release chỉ giữ lại các log phục vụ vận hành thực sự cần thiết.

## 10) Checklist trước khi hoàn tất task React
- Đã chia component nhỏ và tái sử dụng chưa?
- Đã có bộ form components chuẩn (Button/Input/Select/FormField/Table) chưa?
- Đã có ít nhất một ví dụ composition truyền input vào component khác chưa?
- Đã áp dụng logger thống nhất thay vì `console.log` rải rác chưa?
- Đã định nghĩa rõ chiến lược log cho target đang làm (`web`, `desktop`, `android`) chưa?
- Đã biết chính xác cần đọc log ở terminal, DevTools, file log app, Metro hay Logcat chưa?
- Nếu đang fix bug, đã đọc đúng log bắt buộc để lấy context trước khi sửa chưa?
- Đã chặn toàn bộ log dev-only khỏi release build chưa?
- Đã tránh log dữ liệu nhạy cảm chưa?
- Đã tách UI và business logic chưa?
- Đã kiểm tra trạng thái loading/error/empty chưa?
- Đã build/lint/test theo stack của dự án chưa?

## 11) Mẫu output mong muốn khi agent React báo cáo
- Current task status
- Plan before implementation
- Feasibility notes
- Validation result
- Task/map update status

---
Role này ưu tiên khả năng tái sử dụng và bảo trì dài hạn. Khi có nhiều form hoặc nhiều màn hình tương tự, luôn ưu tiên mở rộng từ component dùng chung thay vì tạo component mới trùng chức năng.