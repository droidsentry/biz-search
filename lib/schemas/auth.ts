import { z } from "zod";

import { isUserNameUnique } from "../actions/auth/user";
import AwesomeDebouncePromise from "awesome-debounce-promise";

  const passwordSchema = z
    .string()
    .trim()
    .min(6, "最小6文字以上で設定してください")
    .refine(
      (password) => {
        // より緩い条件：英数字を含む
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return hasLetter && hasNumber;
      },
      "英字と数字を含む6文字以上で設定してください"
    );

  export const emailSchema = z
  .email({
    message: "メールアドレスの形式で入力してください。",
  })

  const usernameSchema = z
  .string()
  .trim()
  .min(1, "ユーザー名を入力してください")
  .max(255, "最大255文字までです")
  .refine(
    (username) => {
      // @と.の文字を除外
      return !username.includes('@') && !username.includes('.');
    },
    "ユーザー名に@と.は使用できません"
  )

  const usernameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, "ユーザー名を入力してください")
  .max(255, "最大255文字までです")
  .refine(
    (username) => {
      // @と.の文字を除外
      return !username.includes('@') && !username.includes('.');
    },
    "ユーザー名に@と.は使用できません"
  )
  .refine((userName) => isUserNameUnique(userName));

  export const debouncedUsernameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, "ユーザー名を入力してください")
  .max(255, "最大255文字までです")
  .refine(
    (username) => {
      // @と.の文字を除外
      return !username.includes('@') && !username.includes('.');
    },
    "ユーザー名に@と.は使用できません"
  )
  .refine(
    AwesomeDebouncePromise(
      async (userName) => await isUserNameUnique(userName),
      800
    ),
    {
      message: "このユーザー名は既に使用されています",
    }
  );


  /**
   * サインアップ
   */
  export const signupSchema = z.object({
    email: emailSchema,
    username: usernameWithUniquenessCheckSchema,
    password: passwordSchema,
  });
  /**
   * サインアップ（ユーザー名バリデーション）
   */
  export const extendedSignupSchema = signupSchema.extend({
    username: debouncedUsernameWithUniquenessCheckSchema,
  });
  /**
   * パスワード更新
   */
  export const passwordUpdateSchema = z.object({
    password: passwordSchema,
  });
  /**
   * ログイン
   */
  export const loginWithEmailOrUsernameSchema = z.object({
    emailOrUsername: z.string().trim().min(1).max(255), // メールアドレスかユーザー名を許容するため、特殊文字のチェックは行わない
    password: passwordSchema,
  });
