// 参考①：supabase-doc https://supabase.com/docs/guides/auth/debugging/error-codes
// 参考②：supabase-mdx https://github.com/supabase/supabase/blob/master/apps/docs/components/MDX/auth_error_codes_table.mdx
// 参考③：nino+ https://gist.github.com/dninomiya/53e0054e72bb6da54bd8419b1e62a187
const supabaseAuthErrors = {
  anonymous_provider_disabled: "匿名サインインが無効です。",
  bad_code_verifier:
    "提供されたコード検証値が正しいものと一致しません。クライアントライブラリの実装にバグがあります。",
  bad_json: "リクエストのHTTPボディが無効なJSONです。",
  bad_jwt: "Authorizationヘッダーに送信されたJWTが無効です。",
  bad_oauth_callback:
    "OAuthプロバイダーからAuthへのコールバックに必要な属性が不足しています。OAuthプロバイダーやクライアントライブラリの実装に問題があります。",
  bad_oauth_state:
    "OAuthプロバイダーからSupabase Authに戻されたOAuth状態が正しい形式ではありません。OAuthプロバイダーの統合に問題があります。",
  captcha_failed:
    "キャプチャプロバイダーによってキャプチャチャレンジを検証できませんでした。キャプチャ統合を確認してください。",
  conflict:
    "データベースの競合が発生しました。リソースを同時に変更しようとすると、競合が発生することがあります。アプリで同時実行の問題が発生していないか確認し、検出された場合は指数関数的にバックオフしてください。",
  email_address_not_authorized:
    "このメールアドレスへのメール送信は許可されていません。プロジェクトでデフォルトのSMTPサービスを使用している場合、Supabase組織のメンバーにのみメールを送信できます。外部にメールを送信するには、カスタムSMTPプロバイダーを設定してください。",
  email_conflict_identity_not_deletable:
    "このアイデンティティをリンク解除すると、ユーザーのアカウントが既に別のユーザーアカウントに使用されているメールアドレスに変更されます。ユーザーが複数のアカウントを使用している場合、データのマイグレーションが必要です。",
  email_exists: "メールアドレスは既にシステムに存在しています。",
  email_not_confirmed:
    "このユーザーはメールアドレスが確認されていないため、サインインできません。",
  email_provider_disabled: "メールとパスワードでのサインアップが無効です。",
  flow_state_expired:
    "関連するPKCEフローの状態が期限切れです。ユーザーに再度サインインするように依頼してください。",
  flow_state_not_found:
    "関連するPKCEフローの状態が存在しません。フロー状態は時間が経つとクリーニングされるため、このエラーが発生することがあります。ユーザーに再度サインインするように依頼してください。",
  hook_payload_over_size_limit:
    "Authからのペイロードが最大サイズを超えています。",
  hook_timeout: "フックに最大時間内で到達できませんでした。",
  hook_timeout_after_retry: "再試行の後もフックに到達できませんでした。",
  identity_already_exists:
    "このAPIに関連するアイデンティティは既にユーザーにリンクされています。",
  identity_not_found: "API呼び出しに関連するアイデンティティが存在しません。",
  insufficient_aal:
    "このAPIを呼び出すには、ユーザーがより高い認証保証レベル（AAL）が必要です。ユーザーにMFAチャレンジを解決するように依頼してください。",
  invite_not_found: "招待が期限切れか既に使用されています。",
  invalid_credentials: "ログイン資格情報または認可タイプが認識されません。", // あとで削除
  manual_linking_disabled:
    "`supabase.auth.linkUser()`および関連するAPIがAuthサーバーで有効になっていません。",
  mfa_challenge_expired:
    "MFAチャレンジへの応答は一定時間内に行う必要があります。このエラーが発生した場合は、新しいチャレンジをリクエストしてください。",
  mfa_factor_name_conflict:
    "単一のユーザーに対してMFAファクターのフレンドリーネームが重複しています。",
  mfa_factor_not_found: "MFAファクターが存在しません。",
  mfa_ip_address_mismatch:
    "MFAファクターの登録プロセスは、同じIPアドレスで開始および終了する必要があります。",
  mfa_verification_failed:
    "MFAチャレンジの検証に失敗しました。TOTPコードが正しくありません。",
  mfa_verification_rejected: "MFAの追加検証が拒否されました。",
  mfa_verified_factor_exists:
    "ユーザーには既に確認済みの電話ファクターが存在します。",
  mfa_totp_enroll_disabled: "MFA TOTPファクターの登録が無効です。",
  mfa_totp_verify_disabled:
    "TOTPファクターを使用したログインと新しいTOTPファクターの検証が無効です。",
  mfa_phone_enroll_disabled: "MFA電話ファクターの登録が無効です。",
  mfa_phone_verify_disabled:
    "電話ファクターを使用したログインと新しい電話ファクターの検証が無効です。",
  no_authorization: "このHTTPリクエストには`Authorization`ヘッダーが必要です。",
  not_admin:
    "APIにアクセスしているユーザーは管理者ではありません。JWTに`role`クレームが含まれていません。",
  oauth_provider_not_supported:
    "Authサーバーで無効になっているOAuthプロバイダーを使用しています。",
  otp_disabled: "OTP（マジックリンク、メールOTP）によるサインインが無効です。",
  otp_expired:
    "このサインインのOTPコードが期限切れです。ユーザーに再度サインインするように依頼してください。",
  over_email_send_rate_limit:
    "このメールアドレスに送信されたメールが多すぎます。しばらく待ってから再試行するように依頼してください。",
  over_request_rate_limit:
    "このクライアント（IPアドレス）から送信されたリクエストが多すぎます。数分後に再試行してください。",
  over_sms_send_rate_limit:
    "この電話番号に送信されたSMSメッセージが多すぎます。しばらく待ってから再試行してください。",
  phone_exists: "電話番号は既にシステムに存在しています。",
  phone_not_confirmed:
    "このユーザーは電話番号が確認されていないため、サインインできません。",
  phone_provider_disabled: "電話とパスワードでのサインアップが無効です。",
  provider_disabled:
    "OAuthプロバイダーが無効です。サーバーの設定を確認してください。",
  provider_email_needs_verification:
    "一部のOAuthプロバイダーはユーザーのメールアドレスを確認しません。",
  reauthentication_needed: "パスワードを変更するためには再認証が必要です。",
  reauthentication_not_valid:
    "再認証の検証に失敗しました。コードが間違っています。",
  request_timeout:
    "リクエストの処理が長すぎました。リクエストを再試行してください。",
  same_password: "現在のパスワードとは異なるパスワードを使用してください。",
  saml_assertion_no_email:
    "サインイン後にSAMLアサーションが受信されましたが、メールアドレスが見つかりませんでした。",
  saml_assertion_no_user_id:
    "サインイン後にSAMLアサーションが受信されましたが、ユーザーIDが見つかりませんでした。",
  saml_entity_id_mismatch:
    "SAML IDプロバイダーのエンティティIDがデータベースのエンティティIDと一致しません。",
  saml_idp_already_exists: "既に追加されているSAML IDプロバイダーです。",
  saml_idp_not_found: "SAML IDプロバイダーが見つかりません。",
  saml_metadata_fetch_failed:
    "SAMLプロバイダーのメタデータを取得できませんでした。",
  saml_provider_disabled:
    "サーバーでSAML 2.0によるEnterprise SSOが無効になっています。",
  saml_relay_state_expired:
    "SAMLリレー状態が期限切れです。再度サインインしてください。",
  saml_relay_state_not_found: "SAMLリレー状態が見つかりません。",
  session_not_found: "APIリクエストに関連するセッションが存在しません。",
  signup_disabled: "サーバーで新規アカウント作成が無効になっています。",
  single_identity_not_deletable:
    "すべてのユーザーには少なくとも1つのアイデンティティが必要です。",
  sms_send_failed: "SMSメッセージの送信に失敗しました。",
  sso_domain_already_exists:
    "1つのSSOアイデンティティプロバイダーに対して登録できるSSOドメインは1つだけです。",
  sso_provider_not_found: "SSOプロバイダーが見つかりません。",
  too_many_enrolled_mfa_factors:
    "ユーザーには登録されたMFAファクターが多すぎます。",
  unexpected_audience:
    "リクエストの`X-JWT-AUD`クレームがJWTのオーディエンスと一致しません。",
  unexpected_failure: "認証サービスに予期しないエラーが発生しました。",
  user_already_exists:
    "この情報（メールアドレス、電話番号）を持つユーザーは既に存在します。", // あとで削除
  user_banned:
    "ユーザーが禁止されています。`banned_until`プロパティがまだ有効です。",
  user_not_found: "APIリクエストに関連するユーザーが存在しません。",
  user_sso_managed:
    "SSOから来たユーザーは特定のフィールド（例えばメールアドレス）を更新できません。",
  validation_failed: "提供されたパラメータが予期された形式ではありません。",
  weak_password: "パスワードが強度基準を満たしていません。",
} as const;

export type SupabaseAuthErrorCode = keyof typeof supabaseAuthErrors;

export const getSupabaseAuthErrorMessage = async (
  code: SupabaseAuthErrorCode
): Promise<string> => {
  return supabaseAuthErrors[code];
};