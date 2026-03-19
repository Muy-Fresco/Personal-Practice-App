class Player {
  constructor(name, main) {
    this.name = name;
    this.main = main;
    this.characters = [];
    this.practiceList = new Set();
    this.nicknames = {};
    this.appleKills = {};
    this.notes = "";
  }

  async loadData() {
    const [charData, nicknameData, appleData, notesData] = await Promise.all([
      fetch("characters.json").then(res => res.json()).catch(() => ({})),
      fetch("nicknames.json").then(res => res.json()).catch(() => ({})),
      fetch("applekill.json").then(res => res.json()).catch(() => ({})),
      fetch("notes.txt").then(res => res.text()).catch(() => "")
    ]);

    this.characters = charData.characters || [];
    this.nicknames = nicknameData || {};
    this.appleKills = appleData || {};
    this.notes = notesData || "";

    // Load saved practice list if available
    const saved = JSON.parse(localStorage.getItem("practiceList") || "[]");
    this.practiceList = new Set(saved);
  }

  // Save practice list to localStorage as JSON string
  savePracticeList() {
    localStorage.setItem("practiceList", JSON.stringify([...this.practiceList]));
  }

  // Resolves nicknames and character names to the official character name
  resolveNickname(input) {
    const lower = input.toLowerCase();
    const foundChar = this.characters.find(c => c.toLowerCase() === lower);
    if (foundChar) return foundChar;
    for (const [character, nickList] of Object.entries(this.nicknames)) {
      if (nickList.some(n => n.toLowerCase() === lower)) return character;
    }
    return null;
  }

  // Adds character to the practice list
  addPractice(name) {
    const resolved = this.resolveNickname(name);
    if (resolved) {
      this.practiceList.add(resolved);
      this.savePracticeList();
      return `${resolved} added to practice list.`;
    }
    return "Character not found.";
  }

  // Removes character from practice list
  removePractice(name) {
    const resolved = this.resolveNickname(name);
    if (resolved && this.practiceList.has(resolved)) {
      this.practiceList.delete(resolved);
      this.savePracticeList();
      return `${resolved} removed from practice list.`;
    }
    return "Character not found in practice list.";
  }

  // Returns sorted array of characters in practice list
  getPracticeList() {
    return Array.from(this.practiceList).sort();
  }

  // Clears the practice list and saves the empty state
  clearPracticeList() {
    this.practiceList.clear();
    this.savePracticeList();
    output("Cleared.")
  }

  getRoster() {
    return this.characters.sort();
  }

  // Returns formatted apple kill data for a character, handling both single and multiple subcategories
  getAppleKills(name) {
    const resolved = this.resolveNickname(name);
    const data = this.appleKills[resolved];
    const stageNameMap = {
      BF_Kalos: "BF and Kalos",
      SV_Town: "SV and Town",
      SBF_FD_PS2_Hollow: "SBF, FD, PS2, and Hollow"
    };
    if (!data) return "No apple kill data found.";

    const output = [];
    if (typeof data === "object" && Object.values(data)[0] instanceof Object) {
      for (const [sub, stages] of Object.entries(data)) {
        output.push(`🍎 ${sub}:`);
        for (const [key, label] of Object.entries(stageNameMap)) {
          output.push(` - ${label}: ${stages[key] || "No data"}`);
        }
      }
    } else {
      for (const [key, label] of Object.entries(stageNameMap)) {
        output.push(`🍎 ${label}: ${data[key] || "No data"}`);
      }
    }
    return output.join("\n");
  }
  
  // Extracts notes for a character by finding the section in the notes text that starts with the character's name and ends at the next character name
  getNotes(name) {
    const resolved = this.resolveNickname(name);
    if (!resolved) return "Character not found.";
    const lines = this.notes.split("\n");
    const results = [];
    let capturing = false;
    for (const line of lines) {
      if (line.trim() === resolved) {
        capturing = true;
        continue;
      }
      
      if (this.characters.includes(line.trim()) && line.trim() !== resolved && capturing) break;
      
      if (capturing) results.push(line);
    }
    return results.length ? results.join("\n") : "No notes found.";
  }
} // End of Player class

const player = new Player("Fresh", "Pac-Man");
let selectedCharacter = null;

player.loadData().then(() => console.log("Data loaded."));

function output(text) {
  document.getElementById("output").innerText = text;
}

function setCharacter() {
  const input = document.getElementById("character-input").value.trim();
  if (!input) {
    output("Please enter a character name.");
    return;
  }
  const resolved = player.resolveNickname(input);
  if (!resolved) {
    output("Character not recognized.");
    selectedCharacter = null;
    document.getElementById("current-char").innerText = "No character selected";
  } else {
    selectedCharacter = resolved;
    document.getElementById("current-char").innerText = `Selected: ${resolved}`;
    output(`Character set to ${resolved}`);
  }
}

/* 
Filters the character list based on user input and displays 
matching characters in a dropdown with images. 

Handles clicks to select a character from the dropdown.
*/
function filterCharacters() {
  const input = document.getElementById("character-input").value.toLowerCase();
  const dropdown = document.getElementById("dropdown");
  dropdown.innerHTML = "";
  if (!input) {
    dropdown.style.display = "none";
    return;
  }

  const matches = player.characters.filter(char =>
    char.toLowerCase().includes(input)
  );

  if (matches.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  matches.forEach(match => {
    const item = document.createElement("div");
    item.className = "dropdown-item";

    // Find image file (fallback to generic if missing)
    const imageFile = findCharacterImage(match);
    const img = document.createElement("img");
    img.src = `images/${imageFile}`;
    img.alt = match;

    const span = document.createElement("span");
    span.textContent = match;

    item.appendChild(img);
    item.appendChild(span);
    item.onclick = () => selectCharacterFromDropdown(match);

    dropdown.appendChild(item);
  });

  dropdown.style.display = "block";
}

// Maps character names to their image files, handling known exceptions and a default naming pattern
function findCharacterImage(character) {
  // Convert name to lowercase and handle nicknames
  const lower = character.toLowerCase();
  // Example conversion for known short names
  const map = {
    "meta knight": "chara_2_mk_00.png",
    "isabelle": "chara_2_isabelle_00.png",
    "pac-man": "chara_2_pacman_00.png",
    "bowser jr.": "chara_2_koopajr_00.png"
  };

  if (map[lower]) return map[lower];

  if (lower.includes("dr")) return "chara_2_drmario_00.png";
  if (lower.includes("game")) return "chara_2_gamewatch_00.png";
  if (lower.includes("rosalina") || lower.includes("luma")) return "chara_2_rosalina_00.png";
  if (lower.includes("k. rool") || lower.includes("krool")) return "chara_2_krool_00.png";
  if (lower.includes("banjo") || lower.includes("kazooie")) return "chara_2_banjo_00.png";
  if (lower.includes("r.")) return "chara_2_robot_00.png"
  // Default naming pattern if not in map
  return `chara_2_${lower.replace(/[^a-z0-9]/g, "_")}_00.png`;
}

// When a character is selected from the dropdown, set the input value, hide the dropdown, and automatically set the character
function selectCharacterFromDropdown(character) {
  document.getElementById("character-input").value = character;
  document.getElementById("dropdown").style.display = "none";
  setCharacter(); // Automatically set it
}

// Adds the selected character to the practice list, ensuring a character is selected first
function addChar() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.addPractice(selectedCharacter));
}

// Removes the selected character from the practice list, ensuring a character is selected first
function removeChar() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.removePractice(selectedCharacter));
}

// Displays the current practice list or a message if it's empty
function viewPractice() {
  const list = player.getPracticeList();
  output(list.length ? "Practice List:\n" + list.join(", ") : "Practice list is empty.");
}

// Displays the apple kill percentage for selectec character or a message if it's empty
function showApple() {
  if (!selectedCharacter) return output("No character selected.");
  output(player.getAppleKills(selectedCharacter));
}

// Displays the notes for the selected character, removing the OOS Punishes section if it appears, or a message if no character is selected or no notes are found
function showNotes() {
  if (!selectedCharacter) return output("No character selected.");
  
  let notes = player.getNotes(selectedCharacter);

  // 🧹 Remove OOS Punishes section if it appears
  const oosIndex = notes.indexOf("🛡️ Out of Shield Punishes vs");
  if (oosIndex !== -1) {
    notes = notes.substring(0, oosIndex).trim();
  }

  output(notes || "No notes found.");
}

// Extracts the Out of Shield Punishes section for the selected character from the notes text, starting from the header and ending at the next character name
function extractOOSSection(notesText, selectedCharacter) {
  const lines = notesText.split("\n");
  const result = [];
  let capturing = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start when we see the correct OOS header
    if (trimmed.startsWith(`🛡️ Out of Shield Punishes vs ${selectedCharacter}`)) {
      capturing = true;
      result.push(line); // include the header itself
      continue;
    }

    // Stop when we hit another character name (means next section)
    if (
      capturing &&
      trimmed !== "" &&
      player.characters.includes(trimmed)
    ) {
      break;
    }

    // Capture all lines once active
    if (capturing) {
      result.push(line);
    }
  }

  return result.length ? result.join("\n") : null;
}

// Displays the Out of Shield Punishes section for the selected character or a message if no character is selected or no OOS data is found
function showOOS() {
  if (!selectedCharacter) return output("No character selected.");
  const notes = player.getNotes(selectedCharacter);
  const oosSection = extractOOSSection(notes, selectedCharacter);

  if (oosSection) output(oosSection);
  else output(`No Out of Shield data found for ${selectedCharacter}.`);
}

// Loads the OOS data from the JSON file and stores it in a variable for later use, logging success or failure to the console
let oosData = {};

fetch("oosdata.json")
  .then(res => res.json())
  .then(data => {
    oosData = data;
    console.log("OOS data loaded.");
  })
  .catch(err => console.error("Failed to load OOS data:", err));

/* Displays the OOS stats for the selected character by:
  - looking up the character in the loaded OOS data
  - handling case and punctuation differences in character names
  - and formatting the output/or showing a message if no character is selected or no OOS stats are found
*/
function showOOSStats() {
  if (!selectedCharacter) {
    return output("No character selected.");
  }

  const resolved = player.resolveNickname(selectedCharacter);

  // Find matching key regardless of case / punctuation
  const key = Object.keys(oosData).find(
    k => k.toLowerCase().replace(/[^a-z0-9]/g, "") ===
         resolved.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  if (!key) {
    return output(`No OOS stats found for ${resolved}.`);
  }

  const data = oosData[key];

  const text = `
🛡️ Out of Shield Data vs ${key}

Fastest: ${data.fastest.moves} (Frame ${data.fastest.frame})

2nd Fastest: ${data.second.moves} (Frame ${data.second.frame})

3rd Fastest: ${data.third.moves} (Frame ${data.third.frame})

Grab: Frame ${data.grab}
Grab (Post Shieldstun): ${data.grab_post_shieldstun}

Item Throw (Forward): ${data.item_throw_forward}
Item Throw (Back): ${data.item_throw_back}

Jump + Z-Drop (Front): ${data.jump_zdrop_front}
Jump + Z-Drop (Back): ${data.jump_zdrop_back}
`;

  output(text);
}


// 🕹️ DAL Checker
function getDAL() {
  const works = ["Link", "Samus", "Kirby", "Fox", "Pikachu", "Captain Falcon", "Peach", "Sheik", "Zelda", "Marth",
      "Lucina", "Roy", "Chrom", "Charizard", "Toon Link", "Mega Man", "Wii Fit Trainer", "Rosalina & Luma", "Little Mac", "Pac-Man",
      "Robin", "Shulk", "Ryu", "Ken", "Bayonetta", "Inkling", "Piranha Plant", "Hero", "Terry", "Kazuya", "Mii Gunner"];
  
  const t_works = ["Donkey Kong", "Pit", "Wario", "King Dedede", "R.O.B.", "Wolf",
      "Palutena", "Corrin", "Simon", "Richter", "Incineroar", "Joker", "Banjo & Kazooie", "Byleth", "Aegis"];
  
  const fsmash_lol = ["Mario", "Yoshi", "Luigi", "Ness", "Jigglypuff", "Bowser", "Ice Climbers", 
      "Dr. Mario", "Pichu", "Falco", "Young Link", "Mewtwo", "Mr. Game & Watch", "Meta Knight", "Zero Suit Samus",
      "Squirtle", "Ivysaur", "Lucas", "Olimar", "Lucario", "Villager", "Bowser Jr.", "Duck Hunt", "Isabelle",
      "Min Min", "Mii Brawler", "Mii Swordfighter"];

  let message = "";
  if (!selectedCharacter) return output("No character selected.");

  if (works.includes(selectedCharacter)) {
    message = `Down Smash at Ledge works against ${selectedCharacter}.`;
  } else if (t_works.includes(selectedCharacter)) {
    message = `Down Smash at Ledge *typically* works against ${selectedCharacter}, you may want to space it closer to the ledge.`;
  } else if (fsmash_lol.includes(selectedCharacter)) {
    message = `Just fsmash ${selectedCharacter} lol.`;
  } else {
    message = `Doesn't work on ${selectedCharacter}.`;
  }

  output(message);
}


function viewRoster() {
  const list = player.getRoster();
  output(list.length ? "Full Roster:\n" + list.join(", ") : "Roster is empty.");
}
