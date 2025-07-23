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
  .min(1, "ユーザー名を入力してください")
  .max(255, "最大255文字までです")
  .refine((userName) => isUserNameUnique(userName));

  export const debouncedUsernameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, "ユーザー名を入力してください")
  .max(255, "最大255文字までです")
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
   * ユーザー名バリデーション
   * 通信パフォーマンスを上げるためDebounceを使用しない関数。
   * 主にサーバーアクションでユーザー名の重複チェックを行う。
   */
  export const passwordUpdateSchema = z.object({
    email: emailSchema,
    username: usernameWithUniquenessCheckSchema,
    password: passwordSchema,
  });
  /**
   * ユーザー名バリデーション
   * 主にフロントエンドでユーザー名の重複チェックを行う。
   */
  export const extendedSignUpSchema = passwordUpdateSchema.extend({
    username: debouncedUsernameWithUniquenessCheckSchema,
  });

  export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
  });
