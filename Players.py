import os
import json

class Players:
    def __init__(self, name, main):
        self.name = name
        self.main = main
        self.save_file = "practice.json"
        self.characters = self.load_characters()
        self.practice_list = self.load_practice_list()
        self.nicknames = self.load_nicknames()
        self.applekills = self.load_apple_kills()
        self.notes = self.load_notes()

    def load_characters(self):
        if os.path.exists("characters.json"):
            with open("characters.json", "r") as file:
                data = json.load(file)
                return data["characters"]
        return []

    def load_practice_list(self):
        if os.path.exists(self.save_file):
            with open(self.save_file, "r") as file:
                return set(json.load(file))
        return set()

    def load_nicknames(self):
        if os.path.exists("nicknames.json"):
            with open("nicknames.json", "r") as file:
                return json.load(file)
        return {}

    def resolve_nickname(self, input_name):
        input_name = input_name.lower()
        # Direct match
        for char in self.characters:
            if char.lower() == input_name:
                return char
        # Nickname match
        for character, nicknames in self.nicknames.items():
            if input_name in [nickname.lower() for nickname in nicknames]:
                return character
        return None

    def roster(self):
        print("\nFull Roster:")
        for char in sorted(self.characters):
            print(f"- {char}")
        print()

    def set_practice(self):
        while True:
            choice = input("Enter a character to practice with (press 'q' to quit): ").strip()
            if choice.lower() == 'q':
                break

            matched_character = self.resolve_nickname(choice)

            if matched_character:
                if matched_character not in self.practice_list:
                    self.practice_list.add(matched_character)
                    print(f"{matched_character} added to practice list.\n")
                else:
                    print(f"{matched_character} is already in your practice list.\n")
            else:
                print("Character not found. Please enter a valid name.\n")

    def get_practice(self):
        if self.practice_list:
            print("\nYour Practice List:")
            print(", ".join(sorted(self.practice_list)))
        else:
            print("Your practice list is empty.")
        print()

    def save_practice_list(self):
        with open(self.save_file, "w") as file:
            json.dump(list(self.practice_list), file)
        print("Practice list saved!\n")

    def remove_practice(self):
        while True:
            choice = input("Enter a character to remove from your practice list (press 'q' to quit): ").strip()
            if choice.lower() == 'q':
                break

            matched_character = self.resolve_nickname(choice)

            if matched_character and matched_character in self.practice_list:
                self.practice_list.remove(matched_character)
                self.save_practice_list()
                print(f"{matched_character} has been removed from your practice list.\n")
            else:
                print("Character not found in practice list. Please enter a valid name.\n")

    def clear_practice_list(self):
        confirm = input("Are you sure you want to clear your practice list? (yes/no): ").strip().lower()
        if confirm == "yes":
            self.practice_list.clear()
            self.save_practice_list()
            print("Practice list cleared!\n")
        else:
            print("Clear action canceled.\n")

    def load_apple_kills(self):
        if os.path.exists("applekill.json"):
            with open("applekill.json", "r") as file:
                return json.load(file)
        return {}
    
    def get_apple_kills(self):
        choice = input("Enter a character: ").strip()
        matched_character = self.resolve_nickname(choice)

        if not matched_character or matched_character not in self.applekills:
            print("Character not found. Please enter a valid name.\n")
            return

        stage_name_map = {
            "BF_Kalos": "BF and Kalos",
            "SV_Town": "SV and Town",
            "SBF_FD_PS2_Hollow": "SBF, FD, PS2, and Hollow"
        }

        data = self.applekills[matched_character]

        print(f"\nApple Kill Percentages for {matched_character}:")

        # Check if this character has sub-branches (like Mythra/Pyra)
        if isinstance(data, dict) and all(isinstance(v, dict) for v in data.values()):
            for subchar, stages in data.items():
                print(f"\n  {subchar}:")
                for stage_key, stage_label in stage_name_map.items():
                    if stage_key in stages:
                        print(f"    🍎: {stages[stage_key]} on {stage_label}")
                    else:
                        print(f"    No data for {stage_label}")
        else:
            # Normal character
            for stage_key, stage_label in stage_name_map.items():
                if stage_key in data:
                    print(f"🍎: {data[stage_key]} on {stage_label}")
                else:
                    print(f"No data for {stage_label}")

    def has_reflector(self, choice):
        reflector_chars = ["Dark Pit", "Dr. Mario", "Falco", "Fox", "Hero", "Joker", "Kazuya",
                           "King K. Rool", "Lucas", "Mario", "Mewtwo", "Mii Gunner",
                           "Mii Swordfighter", "Min Min",
                           "Mr. Game and Watch", "Pit", "Wolf", "Zelda"]
        matched_character = self.resolve_nickname(choice)
        if matched_character in reflector_chars:
            reflector = True
            print(f"{matched_character}: Has Reflector?: {reflector}")

    def rolls_under_trampoline(self, choice):
        trampoline_list = ["Bayonetta", "Diddy", "Fox", "Pikachu", "Pichu", "Peach", "Zelda", "Mr. Game and Watch", "Jigglypuff",
                           "Isabelle", "Olimar", "Toon Link", "Wolf", "Duck Hunt"]
        matched_character = self.resolve_nickname(choice)
        if matched_character in trampoline_list:
            RUT = True
            print(f"{matched_character}: Rolls Under Trampoline?: {RUT}")

    def get_strategy(self):
        choice = input("Enter a character: ").strip()
        print()
        self.has_reflector(choice)
        self.isLedgeFiend(choice)
        self.isLedgeExpert(choice)
        self.rolls_under_trampoline(choice)
        self.get_notes(choice)

    def isLedgeFiend(self, choice):
        ledgeFiend = False
        ledge_fiends = ["Belmonts", "Falcon", "Cloud", "Dr. Mario", "Duck Hunt", "Falco", "Fox", "Hero",
                        "Ice Climbers", "Isabelle", "Joker", "DDD", "Link", "Lucas", "Luigi", "Mii Gunner", 
                        "Min Min" "Mr. Game and Watch", "Olimar", "Palutena", "Piranha Plant", "R.O.B", "Ridley", 
                        "Robin", "Samus", "Snake", "Wolf", "Zelda", "ZSS"]
        matched_character = self.resolve_nickname(choice)
        if matched_character in ledge_fiends:
            ledgeFiend = True
            print(f"Ledge Fiend?: {ledgeFiend}")

    def isLedgeExpert(self, choice):
        ledgeExpert = False
        ledge_experts =["Hero", "Lucas", "Mr. Game and Watch", "Ness", "Peach", "Ivysaur", "Zard", 
                        "Sephiroth", "Sora", "Wii Fit Trainer", "Yoshi", "Zelda", "ZSS"]
        matched_character = self.resolve_nickname(choice)
        if matched_character in ledge_experts:
            ledgeExpert = True
            print(f"Ledge Expert?: {ledgeExpert}")
    
    def load_notes(self):
        if os.path.exists("notes.txt"):
            with open("notes.txt", "r") as file:
                return file.read()
        return ""
    
    def get_notes(self, choice):
        matched_character = self.resolve_nickname(choice)
        if not matched_character:
            print("Character not found.")
            return

        lines = self.notes.splitlines()
        capture = False
        result = []
    
        for line in lines:
            stripped = line.strip()
            # If we see a new character header and we're already capturing, break
            if stripped in self.characters and stripped != matched_character:
                if capture:
                    break
            # Start capturing when we hit the matched character
            if stripped == matched_character:
                capture = True
                continue
            # While capturing, add each line to result
            if capture:
                result.append(line)

        if result:
            
            print(f"\n--- {matched_character} Notes ---")
            print("\n".join(result))
        else:
            print(f"No notes found for {matched_character}.")     

    def main_menu(self):
        while True:
            print("==== Smash Practice Menu ====")
            print(f"Player: {self.name} | Main: {self.main}")
            print()
            print("1. View Full Roster")
            print()
            print("2. Add Character to Practice List")
            print()
            print("3. View Practice List")
            print()
            print("4. Remove Character from Practice List")
            print()
            print("5. Clear Practice List")
            print()
            print("6. Save Practice List")
            print()
            print("7. Get Strategy")
            print()
            print("8. Apple Kill Percentages")
            print()
            print("9. Exit")
            choice = input("Choose an option (1-8): ").strip()

            if choice == "1":
                self.roster()
            elif choice == "2":
                self.set_practice()
            elif choice == "3":
                self.get_practice()
            elif choice == "4":
                self.remove_practice()
            elif choice == "5":
                self.clear_practice_list()
            elif choice == "6":
                self.save_practice_list()
            elif choice == "7":
                self.get_strategy()
                break
            elif choice == "8":
                self.get_apple_kills()
            elif choice == "9":
                print("Exiting... Practice hard!")
                self.save_practice_list()
                break
            else:
                print("Invalid choice. Please enter a number between 1 and 8.\n")


if __name__ == "__main__":
    player1 = Players("Fresh", "Pac-Man")
    player1.main_menu()
