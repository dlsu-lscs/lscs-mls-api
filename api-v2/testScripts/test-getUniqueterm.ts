import { getUniqueTerms } from "../src/services/course.service.ts";

async function testGetUniqueTerms() {
  try {
    const terms = await getUniqueTerms();

    console.log("=== Test: Get Unique Terms ===");
    console.log(`Unique terms found: ${terms.length}`);
    console.log(terms);

    // Verify that there are no duplicates.
    const hasDuplicates = terms.length !== new Set(terms).size;
    console.log(`Has duplicates: ${hasDuplicates}`);

    // Verify that no null-equivalent or empty terms are returned.
    const hasInvalidTerms = terms.some(
      (term) => term === "" || term == null
    );
    console.log(`Has invalid terms: ${hasInvalidTerms}`);

    // Verify alphabetical ordering.
    const isSorted = terms.every(
      (term, index) => index === 0 || terms[index - 1] <= term
    );
    console.log(`Sorted alphabetically: ${isSorted}`);
  } catch (error) {
    console.error("Failed to retrieve unique terms:", error);
    process.exitCode = 1;
  }
}

testGetUniqueTerms();
