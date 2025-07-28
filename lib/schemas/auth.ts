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

  const usernameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, 'ユーザー名は1文字以上で入力してください')
  .max(20, 'ユーザー名は20文字以内で入力してください')
  // .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます') // エンドユーザーの操作性向上のため、バリデーションを外す
  .regex(/^[^.@]+$/, 'ユーザー名に「.」と「@」は使用できません')
  .refine(async (userName) => await isUserNameUnique(userName));

  export const debouncedUsernameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, 'ユーザー名は1文字以上で入力してください')
  .max(20, 'ユーザー名は20文字以内で入力してください')
  // .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます') // エンドユーザーの操作性向上のため、バリデーションを外す
  .regex(/^[^.@]+$/, 'ユーザー名に「.」と「@」は使用できません')
  .refine(
    AwesomeDebouncePromise(
      async (userName) => await isUserNameUnique(userName),
      500
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
  export const debouncedUsernameSchema = z.object({
    username: debouncedUsernameWithUniquenessCheckSchema,
  });
  export const unDebouncedUsernameSchema = z.object({
    username: usernameWithUniquenessCheckSchema,
  });