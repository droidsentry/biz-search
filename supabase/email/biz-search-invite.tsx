import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BizSearchInviteEmailProps {
  email?: string;
  inviterEmail?: string;
}

export const BizSearchInviteEmail = ({
  email = "{{ .Email }}",
  inviterEmail = "{{ .InviterEmail }}",
}: BizSearchInviteEmailProps) => {
  const previewText = "BizSearchへの招待";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src="https://www.biz-search.tech/logo.png"
                width="80"
                height="80"
                alt="BizSearch"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              <strong>BizSearch</strong>への招待
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              {email}様
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              <Link
                href={`mailto:${inviterEmail}`}
                className="text-blue-600 no-underline"
              >
                {inviterEmail}
              </Link>
              から、<strong>BizSearch</strong>へ招待されました。
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              下記のボタンをクリックして、招待を承認してください。
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email&amp;next={{ .RedirectTo }}"
              >
                招待を承認する
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              この招待メールは<span className="text-black">{email}</span>
              様宛に送信されました。心当たりがない場合は、このメールを無視してください。
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

BizSearchInviteEmail.PreviewProps = {
  email: "user@example.com",
  inviterEmail: "admin@bizsearch.com",
} as BizSearchInviteEmailProps;

export default BizSearchInviteEmail;