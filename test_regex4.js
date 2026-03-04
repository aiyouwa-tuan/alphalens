const strings = [
    "Neutral Analyst: [{'type': 'text', 'text': '好了，这是报告。\\n\\n换行测试', 'extras': {'signature': '123'}}]",
    "Aggressive Analyst: [{'text': '段落2', 'cache_control': null}]",
    "Conservative Analyst: [{'type': 'text', 'text': '段落3'}]",
    "[]"
];

const cleanContent = (raw) => {
    if (!raw) return '';

    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    
    // Convert literal escape sequences to real characters properly right away
    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    // Often the Python list string representation creates strings like:
    // "Neutral Analyst: [{'type': 'text', 'text': 'HERE IS TEXT', 'extras': ...}]"
    // To handle multiple blocks properly without regex mismatches over newlines, we parse it manually.
    let result = "";
    
    // Look for occurrences of `[{` and `text': '`
    const arrayStartPattern = "[{";
    const textKeyPattern1 = "'text': '";
    const textKeyPattern2 = "'text': \"";
    
    let currentIndex = 0;
    while (currentIndex < text.length) {
        let blockStartIndex = text.indexOf(arrayStartPattern, currentIndex);
        if (blockStartIndex === -1) {
            // No more arrays, append the rest
            result += text.substring(currentIndex);
            break;
        }
        
        // Append prefix (like "Neutral Analyst: ")
        result += text.substring(currentIndex, blockStartIndex);
        
        let singleQuoteIndex = text.indexOf(textKeyPattern1, blockStartIndex);
        let doubleQuoteIndex = text.indexOf(textKeyPattern2, blockStartIndex);
        
        let textValStart = -1;
        
        if (singleQuoteIndex !== -1 && (doubleQuoteIndex === -1 || singleQuoteIndex < doubleQuoteIndex)) {
            textValStart = singleQuoteIndex + textKeyPattern1.length;
        } else if (doubleQuoteIndex !== -1) {
            textValStart = doubleQuoteIndex + textKeyPattern2.length;
        }

        // if the text key was found but it's OUTSIDE this array block...
        // let's make sure textValStart < endOfThisArray
        let currentArrayEnd = text.indexOf("]", blockStartIndex);

        if (textValStart === -1 || (currentArrayEnd !== -1 && textValStart > currentArrayEnd)) {
            // Broken format or empty array `[]`
            // Just skip past it
            let arrayEndIndex = text.indexOf("]", blockStartIndex);
            if (arrayEndIndex !== -1) {
                 currentIndex = arrayEndIndex + 1;
                 continue;
            } else {
                 result += text.substring(blockStartIndex);
                 break;
            }
        }
        
        // Find the END of the text content safely
        // It ends at `, 'extras':` or `}]`
        let endIdx1 = text.indexOf("', '", textValStart);
        let endIdx1_2 = text.indexOf("\", '", textValStart);
        let endIdx1_3 = text.indexOf("', \"", textValStart);
        let endIdx1_4 = text.indexOf("\", \"", textValStart);
        let endIdx2 = text.indexOf("'}]", textValStart);
        let endIdx2_2 = text.indexOf("\"}]", textValStart);
        let endIdx3 = text.indexOf("'},", textValStart);
        let endIdx3_2 = text.indexOf("\"},", textValStart);
        
        // Only consider endpoints that are within the current array
        let possibleEnds = [endIdx1, endIdx1_2, endIdx1_3, endIdx1_4, endIdx2, endIdx2_2, endIdx3, endIdx3_2]
            .filter(idx => idx !== -1);
            
        if (currentArrayEnd !== -1) {
             possibleEnds = possibleEnds.filter(idx => idx <= currentArrayEnd);
        }
        
        if (possibleEnds.length > 0) {
            let actualEndIdx = Math.min(...possibleEnds);
            result += text.substring(textValStart, actualEndIdx);
            
            // Fast forward past the end of this array
            let arrayEndIndex = text.indexOf("]", actualEndIdx);
            if (arrayEndIndex !== -1) {
                currentIndex = arrayEndIndex + 1;
            } else {
                currentIndex = actualEndIdx;
            }
        } else {
             // Fallback if no matching end found
             result += text.substring(textValStart);
             break;
        }
    }

    return result.trim();
};

for (let s of strings) console.log(cleanContent(s));

