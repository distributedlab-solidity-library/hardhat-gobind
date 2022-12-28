import { execSync } from "child_process"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import _ from "lodash"
import { basename, resolve } from "path"
import { existsSync, mkdirSync } from "fs"
import { stat, rm } from "fs/promises"

export class Generator {
    private pkgName: string
    private outDir: string
    private dirExists: boolean
    private abigenPath: string
    // I need HRE not only for names, but also for reading artifacts
    // fixme: should I only pass hre.artifacts and outDir?
    constructor(private hre: HardhatRuntimeEnvironment) {
        this.outDir = resolve(hre.config.gobind.outDir)
        this.abigenPath = resolve(hre.config.gobind.abigenPath)
        this.dirExists = existsSync(this.outDir)
        this.pkgName = _.camelCase(basename(this.outDir))
    }

    async generateAll() {
        const names = await this.hre.artifacts.getAllFullyQualifiedNames()
        await this.generate(names)
    }

    async generate(artifactNames: string[]) {
        for (const name of artifactNames) {
            if (!this.dirExists) {
                mkdirSync(this.outDir)
                this.dirExists = true
            }

            const artifact = await this.hre.artifacts.readArtifact(name)
            const abi = JSON.stringify(artifact.abi)
            const contract = artifact.contractName
            // todo: try exec async
            execSync(`echo '${abi}' | ${this.abigenPath} --pkg ${this.pkgName} --type ${contract} --out ${this.outDir}/${contract}.go --abi -`)
        }
    }

    async clean() {
        const dir = resolve(this.outDir) // fixme: use this.dirExists
        if (!existsSync(dir)) return

        const dirStats = await stat(dir)
        if (!dirStats.isDirectory()) {
            console.log(`Warning: path is not a directory, skipping it: ${dir}`)
            return
        }

        await rm(dir, { recursive: true, force: true })
    }
}