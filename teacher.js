
  const renderWebMatches =
    () => {

      if(!webMatches.length){
        return `
          <div class="teacher-kabezya-inspector-empty-row">
            <i class="fa-solid fa-globe" aria-hidden="true"></i>
            <span>
              ${
                webChecked
                  ? "Google Search completed and no supported public-web match was returned."
                  : "Public-web comparison was not performed."
              }
            </span>
          </div>
        `;
      }


      return webMatches
        .slice(0,8)
        .map(
          (match,index) => {

            const sourceUrl =
              normalizeHttpUrl(
                match?.sourceUrl
              );

            const similarity =
              clampPercentage(
                match?.similarityPercent ??
                safeNumber(match?.similarity,0) * 100
              );

            return `
              <article class="teacher-kabezya-evidence-card">
                <div class="teacher-kabezya-evidence-head">
                  <div>
                    <span class="teacher-kabezya-evidence-label">
                      Web match ${index + 1}
                    </span>
                    <strong>${escapeHtml(
                      safeString(match?.sourceTitle,"Public web source")
                    )}</strong>
                  </div>
                  <span class="teacher-kabezya-similarity-badge ${
                    similarity >= 75
                      ? "is-high"
                      : similarity >= 45
                        ? "is-medium"
                        : "is-low"
                  }">${similarity}% similarity</span>
                </div>

                ${
                  match?.submittedText
                    ? `<div class="teacher-kabezya-evidence-text">
                        <span>Student passage</span>
                        <p>${escapeHtml(match.submittedText)}</p>
                      </div>`
                    : ""
                }

                ${
                  match?.matchedText
                    ? `<div class="teacher-kabezya-evidence-text is-match">
                        <span>Matching web passage</span>
                        <p>${escapeHtml(match.matchedText)}</p>
                      </div>`
                    : ""
                }

                <div class="teacher-kabezya-evidence-foot">
                  <span>
                    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                    Google Search evidence
                  </span>
                  ${
                    sourceUrl
                      ? `<a class="teacher-kabezya-message-link"
                           href="${escapeAttribute(sourceUrl)}"
                           target="_blank"
                           rel="noopener noreferrer">
                           Open source
                           <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                         </a>`
                      : ""
                  }
                </div>
              </article>
            `;

          }
        )
        .join("");

    };


      <section
        class="teacher-kabezya-inspector-section"
      >

        <div
          class="teacher-kabezya-inspector-section-head"
        >
          <div>
            <span>
              Internet originality check
            </span>

            <h4>
              Public web comparison
            </h4>
          </div>

          ${
            webChecked
              ? `<span class="teacher-kabezya-inspector-count">
                   ${webMatches.length} match${webMatches.length === 1 ? "" : "es"}
                 </span>`
              : ""
          }
        </div>

        <div class="teacher-kabezya-evidence-list">
          ${renderWebMatches()}
        </div>

        <div class="teacher-kabezya-inspector-disclaimer">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>
            A web match is evidence for teacher review, not automatic proof of plagiarism.
          </span>
        </div>

      </section>

