// "use client";

// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
// import { useRouter, useSearchParams, usePathname } from "next/navigation";
// import { useState, useTransition } from "react";

// import type { SerpstackResponse } from "@/lib/types/serpstack";

// interface PaginationProps {
//   data: SerpstackResponse;
//   isSearching: boolean;
// }

// export default function Pagination({ data, isSearching }: PaginationProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const pathname = usePathname();
//   const [isPending, startTransition] = useTransition();
//   const [clickedPage, setClickedPage] = useState<number | null>(null);
//   const [clickedNav, setClickedNav] = useState<"prev" | "next" | null>(null);

//   // データから必要な値を抽出
//   const currentPage = Number(data.search_parameters?.page) || 1;
//   const totalResults = Number(data.search_information?.total_results) || 0;
//   const resultsPerPage = Number(data.search_parameters?.num) || 10;

//   // プロジェクトIDとオーナーIDをパスから取得
//   const pathSegments = pathname.split("/");
//   const projectId = pathSegments[2];
//   const ownerId = pathSegments[3];

//   const handlePageChange = (
//     newPage: number,
//     buttonType: "page" | "prev" | "next" = "page"
//   ) => {
//     if (buttonType === "page") {
//       setClickedPage(newPage);
//       setClickedNav(null);
//     } else {
//       setClickedNav(buttonType);
//       setClickedPage(null);
//     }
//     startTransition(() => {
//       const params = new URLSearchParams(searchParams.toString());
//       params.set("page", newPage.toString());
//       router.push(`/projects/${projectId}/${ownerId}?${params.toString()}`, {
//         scroll: false,
//       });

//       // ページ遷移後に任意の位置にスクロール
//       // 例: 検索結果の上部にスクロール
//       setTimeout(() => {
//         const searchResultsElement = document.getElementById("search-results");
//         if (searchResultsElement) {
//           searchResultsElement.scrollIntoView({
//             behavior: "smooth",
//             block: "start",
//           });
//         }
//       }, 300);
//     });
//   };
//   // paginationから利用可能なページ番号を取得
//   const availablePages = data.pagination?.pages?.map((p) => p.page) || [];

//   // 現在のページを含むすべての既知のページ
//   const allKnownPages = new Set([...availablePages, currentPage]);

//   // 最大ページ番号を取得
//   const maxKnownPage = availablePages.length > 0
//     ? Math.max(...availablePages)
//     : currentPage;

//   // 総ページ数を計算（既知の最大ページ番号を使用）
//   const totalPages = maxKnownPage;

//   // 前へ・次へボタンの表示判定
//   const showPrevious = currentPage > 1;

//   // 次へボタンは以下の条件で表示:
//   // 1. paginationにnextフィールドがある
//   // 2. availablePagesに現在のページより大きいページがある
//   const hasNextInPages = availablePages.some(page => page > currentPage);
//   const showNext = !!data.pagination?.next || hasNextInPages;
//   // デバッグ情報
//   console.log("Pagination Debug:", {
//     currentPage,
//     availablePages,
//     allKnownPages: Array.from(allKnownPages).sort((a, b) => a - b),
//     maxKnownPage,
//     showPrevious,
//     showNext,
//     hasNextInPages,
//     paginationData: data.pagination,
//   });

//   const shouldShowPagination = showPrevious || showNext || availablePages.length > 1;

//   if (!shouldShowPagination) {
//     return null;
//   }

//   return (
//     <div className="space-y-4 mt-8">
//       <div className="flex items-center justify-center gap-4">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => handlePageChange(currentPage - 1, "prev")}
//           disabled={!showPrevious || isSearching || isPending}
//           className="flex items-center gap-1 cursor-pointer"
//         >
//           {isPending && clickedNav === "prev" ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <ChevronLeft className="h-4 w-4" />
//           )}
//           前へ
//         </Button>

//         <span className="text-sm text-muted-foreground">
//           ページ {currentPage}
//         </span>

//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => handlePageChange(currentPage + 1, "next")}
//           disabled={!showNext || isSearching || isPending}
//           className="flex items-center gap-1"
//         >
//           次へ
//           {isPending && clickedNav === "next" ? (
//             <Loader2 className="h-4 w-4 animate-spin cursor-pointer" />
//           ) : (
//             <ChevronRight className="h-4 w-4" />
//           )}
//         </Button>
//       </div>
//     </div>
//   );
// }
