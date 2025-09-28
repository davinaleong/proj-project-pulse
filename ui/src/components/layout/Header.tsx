import Button from "./../common/Button"
import Breadcrumbs, { type Crumb } from "./../common/Breadcrumbs"
import SearchBar from "./../common/SearchBar"
import DropdownMenu from "../ui/DropdownMenu"
import DropdownMenuItem from "../ui/DropdownMenuItem"
import ImgLogo from "./../../assets/images/logo-coloured-svg.svg"

const items: Crumb[] = [{ label: "Home", onClick: () => {} }]

function Header() {
  return (
    <header id="top" className="flex gap-[1em] max-w-screen">
      <Button
        variant="image"
        type="button"
        color="default"
        src={ImgLogo}
        onClick={() => {}}
      >
        <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
      </Button>

      <Breadcrumbs items={items} className="flex-1" />

      <SearchBar
        className="flex-1"
        onSearch={(query) => console.log("Search query:", query)}
      />

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
