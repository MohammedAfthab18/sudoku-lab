import type { Puzzle } from "@/domain/types";

/** Every puzzle below has exactly one solution (verified in the test suite). */
export const PUZZLES: readonly Puzzle[] = [
  { id: "easy-1", name: "Easy 1", category: "easy", clues: "504120708607345921000000645900007000001000090460000317170230400802000100300600072" },
  { id: "easy-2", name: "Easy 2", category: "easy", clues: "080635002300402000602879040000260153020090080006008200800050600403020008265004730" },
  { id: "easy-3", name: "Easy 3", category: "easy", clues: "109000008058007469000800271904270680002006317000380002017042000003908706000700100" },
  { id: "medium-1", name: "Medium 1", category: "medium", clues: "087200600000000705100005000730009200001060007045000018003920056000080170870600309" },
  { id: "medium-2", name: "Medium 2", category: "medium", clues: "000006104020000008170058903000489010000510000000007200700920000093600402010830570" },
  { id: "medium-3", name: "Medium 3", category: "medium", clues: "320040090009802640006000105100460080002001500080527010000004000450390000903000050" },
  { id: "hard-1", name: "Hard 1", category: "hard", clues: "200000080001000004750000006000003000010700542060081900000170000070802005098500700" },
  { id: "hard-2", name: "Hard 2", category: "hard", clues: "000080600008741000500900083006005008000000060700014520000007030012050000009400100" },
  { id: "hard-3", name: "Hard 3", category: "hard", clues: "320050940000804500001000030009083000000400103000000400157002000600000250080006007" },
  { id: "expert-1", name: "Expert 1", category: "expert", clues: "100000008042000703008064009500800400030000000010040000400170950000000000003000007" },
  { id: "expert-2", name: "Expert 2", category: "expert", clues: "500080200807030000000000900020003000060500400108004000000000570000640008009002060" },
  { id: "expert-3", name: "Expert 3", category: "expert", clues: "000000705008705200040000001900806000000000100000090030030027480002058000000010000" },
  {
    id: "test-no-solution",
    name: "No-solution demo",
    category: "test",
    // No digit repeats, but R1C9 has no legal value: 1–8 are in its row and 9 is in its column.
    clues: "123456780000000009" + "0".repeat(63),
  },
  {
    id: "test-conflict",
    name: "Conflict demo",
    category: "test",
    // Two 5s in the first row.
    clues: "550000000" + "0".repeat(72),
  },
];
