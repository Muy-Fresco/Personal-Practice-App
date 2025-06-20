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
    }
  
    resolveNickname(input) {
      const lower = input.toLowerCase();
      const foundChar = this.characters.find(c => c.toLowerCase() === lower);
      if (foundChar) return foundChar;
      for (const [character, nickList] of Object.entries(this.nicknames)) {
        if (nickList.some(n => n.toLowerCase() === lower)) {
          return character;
        }
      }
      return null;
    }
  
    addPractice(name) {
      const resolved = this.resolveNickname(name);
      if (resolved) {
        this.practiceList.add(resolved);
        return `${resolved} added to practice list.`;
      }
      return "Character not found.";
    }
  
    removePractice(name) {
      const resolved = this.resolveNickname(name);
      if (resolved && this.practiceList.has(resolved)) {
        this.practiceList.delete(resolved);
        return `${resolved} removed from practice list.`;
      }
      return "Character not found in practice list.";
    }
  
    getPracticeList() {
      return Array.from(this.practiceList).sort();
    }
  
    getRoster() {
      return this.characters.sort();
    }
  
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
  
    getNotes(name) {
        const resolved = this.resolveNickname(name);
        if (!resolved) return "Character not found.";
      
        const lines = this.notes.split("\n");
        const results = [];
        let capturing = false;
      
        for (const line of lines) {
          const trimmed = line.trim();
          const lineResolved = this.resolveNickname(trimmed);
      
          if (trimmed === resolved) {
            capturing = true;
            continue;
          }
      
          if (capturing && lineResolved && lineResolved !== resolved) {
            break;
          }
      
          if (capturing) {
            results.push(line);
          }
        }
      
        return results.length ? results.join("\n") : "No notes found.";
      }      
  }
  
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
  
  function addChar() {
    if (!selectedCharacter) return output("No character selected.");
    output(player.addPractice(selectedCharacter));
  }
  function removeChar() {
    if (!selectedCharacter) return output("No character selected.");
    output(player.removePractice(selectedCharacter));
  }
  function viewPractice() {
    const list = player.getPracticeList();
    output(list.length ? "Practice List:\n" + list.join(", ") : "Practice list is empty.");
  }
  function showApple() {
    if (!selectedCharacter) return output("No character selected.");
    output(player.getAppleKills(selectedCharacter));
  }
  function showNotes() {
    if (!selectedCharacter) return output("No character selected.");
    output(player.getNotes(selectedCharacter));
  }
  function viewRoster() {
    const list = player.getRoster();
    output(list.length ? "Full Roster:\n" + list.join(", ") : "Roster is empty.");
  }

  
  