import Button from "./Button"
import Breadcrumbs, { type Crumb } from "./Breadcrumbs"
import SearchBar from "./SearchBar"
import DropdownMenu from "./DropdownMenu"
import DropdownMenuItem from "./DropdownMenuItem"
import ImgLogo from "./../assets/images/logo-coloured-svg.svg"

const items: Crumb[] = [{ label: "Home", onClick: () => {} }]

function Header() {
  return (
    <header className="grid gap-[1em] grid-cols-[1fr_2fr_2fr_1fr] max-w-screen">
      <Button
        variant="image"
        type="button"
        color="default"
        src={ImgLogo}
        onClick={() => {}}
      >
        <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
      </Button>

      <Breadcrumbs items={items} />

      <SearchBar onSearch={(query) => console.log("Search query:", query)} />

      <DropdownMenu label="Modules" color="primary">
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Projects
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Tasks
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Notes
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Activities
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Logout
        </DropdownMenuItem>
      </DropdownMenu>
    </header>
  )
}

export default Header
