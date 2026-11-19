"""
Reusable utility functions for a portfolio project.
Import these functions into other Python programs.
"""

def calculate_percentage(part: float, total: float) -> float:
    """Return part as a percentage of total."""
    if total == 0:
        raise ValueError("total cannot be zero")
    return (part / total) * 100


def clean_text(value: str) -> str:
    """Remove extra spaces and normalize text."""
    return " ".join(value.strip().split())


if __name__ == "__main__":
    print(f"Project completion: {calculate_percentage(8, 10):.1f}%")
    print(clean_text("  Python   for   my portfolio  "))
