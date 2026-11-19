"""
Python demo file for your GitHub portfolio repository.
Run: python python_demo.py
"""

def introduce(name: str, role: str) -> str:
    return f"Hi, I'm {name}. I'm a {role} developer."


def main() -> None:
    print(introduce("Rakesh", "Python and AI/ML"))
    print("Welcome to my portfolio repository!")


if __name__ == "__main__":
    main()
